const path = require('path');
const multer = require('multer');
const db = require('../dbsetup');
const fs = require('fs');
const secret = process.env.SECRET_KEY;
const ITEMS_PER_PAGE = 7;
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const destinationPath = path.join(__dirname, '..', 'public', 'images');
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const fileName = `${file.originalname}`;
      cb(null, fileName);
    }
  });
const upload = multer({ storage }).array('images',3);
class InboxController{
  async inbox(req, res) {
    const userCookie = req.cookies.user;
    const page = req.query.page || 1;
    console.log("page:", page);

    try {
        const pool = await db.connect();

        // Count total number of items
        const totalCountQuery = `
            SELECT COUNT(*) as count
            FROM in_out_box
            INNER JOIN user_has_in_out_box ON user_has_in_out_box.in_out_box_id = in_out_box.id
            INNER JOIN users ON user_has_in_out_box.user_id = users.id
            WHERE user_has_in_out_box.user_id = ? AND user_has_in_out_box.type = ?;
        `;

        const totalCountResult = await pool.query(totalCountQuery, [userCookie.id, 'in']);
        const totalCount = totalCountResult[0][0].count;
        // Calculate pagination parameters
        const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
        const offset = ITEMS_PER_PAGE * (page - 1);
        // Fetch paginated data
        const paginatedQuery = `
            SELECT *
            FROM in_out_box
            INNER JOIN user_has_in_out_box ON user_has_in_out_box.in_out_box_id = in_out_box.id
            INNER JOIN users ON user_has_in_out_box.user_id = users.id
            WHERE user_has_in_out_box.user_id = ? AND user_has_in_out_box.type = ?
            LIMIT ? OFFSET ?;
        `;

        const inBox = await pool.query(paginatedQuery, [userCookie.id, 'in', ITEMS_PER_PAGE, offset]);
           
        // Generate an array representing the pagination pages
        const paginatePage = Array.from({ length: totalPages }, (_, index) => index + 1);
        res.render('layouts/main', {
            user: userCookie,
            page: 'inbox',
            data: inBox[0],
            paginatePage:paginatePage,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        // Handle database query error
        console.error('Error fetching inbox data:', error);
        res.status(500).send('Internal Server Error');
    }
  }
    async compose(req, res) {
      const pool = await db.connect();
      try {
        const userCookie = req.cookies.user;
        const result = await pool.query("SELECT * FROM users WHERE id != ?", [userCookie.id]);
        
        if (result[0].length > 0) {
          res.render('layouts/main', { user: userCookie, page: 'compose', users: result[0],error:"",message:"",recipientErr:"",subjectErr:"",contentErr:""  });
        } else {
          res.render('layouts/main', { user: userCookie, page: 'compose', users: [],error:"",message:"",recipientErr:"",subjectErr:"",contentErr:"" });
        }
      } catch (error) {
        // Handle errors here, for example:
        console.error("Error in compose:", error);
        res.status(500).send("Internal Server Error");
      } finally {
        // Release the connection back to the pool
        await pool.end();
      }
    }
    async postCompose(req, res) {
      const pool = await db.connect();
      let userCookie;
      let result;
      let message = "";
      let recipientErr = "";
      let subjectErr = "";
      let contentErr = ""
    
      try {
        userCookie = req.cookies.user;
        result = await pool.query("SELECT * FROM users");
    
        upload(req, res, async function (err) {
          try {
            if (err instanceof multer.MulterError) {
              return res.render("layouts/main", {
                error: "Allowing three files",
                user: userCookie,
                users: result[0],
                page: "compose",
                message: "",
                recipientErr:"",
                subjectErr:"" 
              });
            } else if (err) {
              return res.status(500).json({ error: err.message });
            }
    
            const { recipient, subject,content } = req.body;
            if(!recipient){
              recipientErr = "recipient can not be null"
            }
            if(!subject){
              subjectErr = "";
            }
            if(!content){
              contentErr = "content can not be null"
            }
            if(recipient === "" || content === ""){
              return res.render("layouts/main", {
                error: "",
                user: userCookie,
                users: result[0],
                page: "compose",
                message: "",
                recipientErr:recipientErr,
                subjectErr:subjectErr,
                contentErr:contentErr,
              });
            } 
            let in_out_box_id;
            let fileNames = [];
    
            if (req.files) {
              fileNames = req.files.map((file) => ({ fileName: file.filename }));
            }
    
            const newFileName = JSON.stringify(fileNames);
    
            if (newFileName && recipient && content) {
              const createInOutBox = await pool.query('INSERT INTO in_out_box (recipient,sender, subject,content, file_link) VALUES (?,?,?,?,?)', [recipient,userCookie.fullName, subject,content, newFileName]);
              if (createInOutBox[0].affectedRows > 0) {
                const result = await pool.query('SELECT * FROM in_out_box ORDER BY created_at DESC LIMIT 1');
                in_out_box_id = result[0][0].id;
              }
    
              const addUserInbox = await pool.query('INSERT INTO user_has_in_out_box (user_id, in_out_box_id,type) VALUES (?,?,?)', [userCookie.id, in_out_box_id,'out']);
              const addUsserIn = await pool.query('INSERT INTO user_has_in_out_box (user_id, in_out_box_id,type) VALUES (?,?,?)', [recipient, in_out_box_id,'in']);
    
              if (addUserInbox[0].affectedRows > 0 && addUsserIn[0].affectedRows >0) {
                message = "Your inbox has been sent successfully";
              }
            }
    
            // Move res.render inside the callback
            return res.render("layouts/main", {
              error: "",
              user: userCookie,
              users: result[0],
              page: "compose",
              message: message,
              recipientErr:recipientErr,
              subjectErr:subjectErr,
              contentErr:contentErr
            });
          } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
          } finally {
            await pool.end();
          }
        });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
    async outbox(req,res){
      const userCookie = req.cookies.user;
      const page = req.query.page || 1;
  
      try {
          const pool = await db.connect();
  
          // Count total number of items
          const totalCountQuery = `
              SELECT COUNT(*) as count
              FROM in_out_box
              INNER JOIN user_has_in_out_box ON user_has_in_out_box.in_out_box_id = in_out_box.id
              INNER JOIN users ON user_has_in_out_box.user_id = users.id
              WHERE user_has_in_out_box.user_id = ? AND user_has_in_out_box.type = ?;
          `;
  
          const totalCountResult = await pool.query(totalCountQuery, [userCookie.id, 'out']);
          const totalCount = totalCountResult[0][0].count;
          // Calculate pagination parameters
          const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
          const offset = ITEMS_PER_PAGE * (page - 1);
  
          // Fetch paginated data
          const paginatedQuery = `
              SELECT *
              FROM in_out_box
              INNER JOIN user_has_in_out_box ON user_has_in_out_box.in_out_box_id = in_out_box.id
              INNER JOIN users ON user_has_in_out_box.user_id = users.id
              WHERE user_has_in_out_box.user_id = ? AND user_has_in_out_box.type = ?
              LIMIT ? OFFSET ?;
          `;
  
          const outBox = await pool.query(paginatedQuery, [userCookie.id, 'out', ITEMS_PER_PAGE, offset]);
          const paginatePage = Array.from({ length: totalPages }, (_, index) => index + 1);
          res.render('layouts/main', {
              user: userCookie,
              page: 'outbox',
              data: outBox[0],
              paginatePage:paginatePage,
              currentPage: page,
              totalPages: totalPages,
          });
      } catch (error) {
          res.status(500).send('Internal Server Error');
      }
    }
    // 
    async inOutBoxDetail(req,res){
      const pool = await db.connect();
      const userCookie = req.cookies.user;
       const {id,type} = req.params;
       const Query = `
       SELECT *
       FROM in_out_box
       INNER JOIN user_has_in_out_box ON user_has_in_out_box.in_out_box_id = in_out_box.id
       INNER JOIN users ON user_has_in_out_box.user_id = users.id
       WHERE user_has_in_out_box.user_id = ? AND user_has_in_out_box.type = ? AND in_out_box.id = ?
   `;   
       const result = await pool.query(Query, [userCookie.id,type,id]);
       const files = JSON.parse(result[0][0].file_link);
       res.render('layouts/main',{
        page:'detail',
        user:userCookie,
        data:result[0][0],
        files:files,
        type:type,
       })
    }

    // download file 
    async downloadFile(req,res){
      const file = req.params.filename;
      const decodedFileData = file;
      console.log(decodedFileData)
      const jsonData = decodedFileData;
      if (jsonData && jsonData.length > 0 && jsonData) {
        const filename = jsonData;
        const filePath = `./public/images/${filename}`; // Change the path as per your file location
        console.log(filePath)
        // Check if the file exists
        if (fs.existsSync(filePath)) {
          // Set the appropriate headers for the response
          res.setHeader('Content-disposition', `attachment; filename=${filename}`);
          res.setHeader('Content-type', 'application/octet-stream');

          // Create a readable stream from the file
          const fileStream = fs.createReadStream(filePath);

          // Pipe the file stream into the response
          fileStream.pipe(res);
        } else {
          res.status(404).send('File not found');
        }
      } else {
        res.status(400).send('Invalid JSON data or missing fileName property');
      }
    }

    // delete email
    async deleteEmail(req,res){
        const {id,type} = req.params;
        const pool = await db.connect();
        const userCookie = req.cookies.user;
        const updateUserInOutBoxQuery = `
        UPDATE user_has_in_out_box
        SET status = 'off'
        WHERE user_id = ? AND in_out_box_id = ? AND type = ?
        `;
        const updateUserInOutBoxQuery2 = `
        UPDATE in_out_box
        SET status = 'off'
        WHERE id = ?
      `;
     const user_has_in_out_box =  await pool.query(updateUserInOutBoxQuery, [userCookie.id, id,type]);
     const in_out_box_update = await pool.query(updateUserInOutBoxQuery2, [id]);
     const page = req.query.page || 1;
     if(user_has_in_out_box[0].affectedRows > 0 && in_out_box_update[0].affectedRows){
      try {
        const pool = await db.connect();

        // Count total number of items
          const totalCountQuery = `
              SELECT COUNT(*) as count
              FROM in_out_box
              INNER JOIN user_has_in_out_box ON user_has_in_out_box.in_out_box_id = in_out_box.id
              INNER JOIN users ON user_has_in_out_box.user_id = users.id
              WHERE user_has_in_out_box.user_id = ? AND user_has_in_out_box.type = ?;
          `;

          const totalCountResult = await pool.query(totalCountQuery, [userCookie.id, 'out']);
          const totalCount = totalCountResult[0][0].count;
          // Calculate pagination parameters
          const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
          const offset = ITEMS_PER_PAGE * (page - 1);

          // Fetch paginated data
          const paginatedQuery = `
              SELECT *
              FROM in_out_box
              INNER JOIN user_has_in_out_box ON user_has_in_out_box.in_out_box_id = in_out_box.id
              INNER JOIN users ON user_has_in_out_box.user_id = users.id
              WHERE user_has_in_out_box.user_id = ? AND user_has_in_out_box.type = ?
              LIMIT ? OFFSET ?;
          `;

          const outBox = await pool.query(paginatedQuery, [userCookie.id,type, ITEMS_PER_PAGE, offset]);
          const paginatePage = Array.from({ length: totalPages }, (_, index) => index + 1);
          res.render('layouts/main', {
              user: userCookie,
              page: 'outbox',
              data: outBox[0],
              paginatePage:paginatePage,
              currentPage: page,
              totalPages: totalPages,
          });
        } catch (error) {
            res.status(500).send('Internal Server Error');
        }
     }
    }
}
module.exports = new InboxController();