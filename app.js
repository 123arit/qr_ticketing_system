const express = require("express");
const ejs = require("ejs");
const path = require("path");
const qrcode = require("qrcode");
const exp = require("constants");
var helper = require('./helper');
var fs = require('fs');
var mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "qr-ticket-db"
});

const pdf = require('html-pdf');
const options = {
  format: 'Letter'
}



const app = express();
const port = process.env.port || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));

app.use(express.static("public"));

app.get("/", (req, res, next) => {
  res.render("index");
});

app.get("/generate", (req, res, next) => {
    res.render("generate");
  });

app.get("/scanner", (req, res, next) => {
    res.render("scanner");
  });

app.post("/ticket", (req, res, next) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;
  var ticketNo;

  var sql = `INSERT INTO tickets (fname, lname, email) VALUES (?, ?, ?)`;

  con.query(sql, [fname, lname, email], function (err, result) {
      if (err){
          console.log(err);
          res.status(500).json({
              message: 'Adding A Ticket Record Failed!'
          });
      }else{
        //console.log("Result",result.insertId);
         ticketNo= ""+result.insertId
        
        const input_json = {
            "fname": fname,
            "lname": lname,
            "email": email,
            "ticketId": ""+result.insertId
        }
        const input_text = JSON.stringify(input_json);
        console.log(input_text);
        qrcode.toDataURL(input_text, (err, src) => {
          if (err) res.send("Something went wrong!!");
          res.render("ticket", {
            qr_code: src,
            fname,
            lname,
            email,
            ticketNo
          });
        });
      } 
      //console.log(result);
  });

  
});

app.post("/download", (req, respns, next) => {

    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.email;
    const ticketNo = req.body.ticketNo;
    const qr_code = req.body.qr_code;


    const html = `<h1 style="color: red">শুভ নববর্ষ ১৪২৯ (April 2022)</h1>
    <p><b>Place</b>: Terraza del Angel, 2032 Calle Volcan Cofre de Perote, Zapopan, JAL 45070, Mexico</p>
    <p><b>Time</b>: 12:00 PM to 5:00 PM (CDT)</p>
    <p><b>Ticket No</b>: ${ticketNo}</p>
    <p><b>Ticket for:</b> ${fname} ${lname}</p>
    <p><b>Email</b>: ${email}</p>
    <img src=${qr_code} alt="QR Code">`

    let r = (Math.random() + 1).toString(36).substring(2);
    console.log("random", r);

    pdf.create(html, options).toFile(`./${fname}_${lname}_${ticketNo}_${r}.pdf`, (err, res) => {
        if (err) {
          console.log(err);
        }

        var file = path.join(__dirname, `./${fname}_${lname}_${ticketNo}_${r}.pdf`);    
        // res.download(file, function (err) {
        //     if (err) {
        //         console.log("Error");
        //         console.log(err);
        //     } else {
        //         console.log("Success");
        //     }    
        // });
        var data =fs.readFileSync(`./${fname}_${lname}_${ticketNo}_${r}.pdf`);
        respns.contentType("application/pdf");
        respns.send(data);
    })

    

})

app.post("/status", (req, res, next) => {
    const ticketNo = req.body.ticketNo;

    var sql = `SELECT * FROM tickets WHERE ticket_id= ?`;

  con.query(sql, [ticketNo], function (err, result) {
      if (err){
          console.log(err);
          res.status(500).json({
              message: 'Getting A Ticket Record Failed!'
          });
      }else{
        console.log("Result",result[0]);

        if(result[0] != undefined){
            res.render("ticketStatus", {
                fname: result[0].fname,
                lname: result[0].lname,
                email: result[0].email,
                ticketNo: result[0].ticket_id,
                entryStatus: result[0].entry,
                brkfstStatus: result[0].breakfast,
                lunchStatus: result[0].lunch
              });
            
        }else{
            res.render('scanner');
        }
         
        
       
      } 
      //console.log(result);
  });
});

app.post("/updateEntry", (req, res, next) => {
    const ticketNo = req.body.ticketNo;
    const entryStatus= req.body.entry;
    const brkfstStatus= req.body.breakfast;
    const lunchStatus = req.body.lunch;

    const updateType= req.body.entryType;
    var changedStatus;
    var sql;

    if(updateType == "entry"){
        sql = `UPDATE tickets SET entry = ? WHERE ticket_id = ?`;
        if(entryStatus == "0"){
            changedStatus = 1;
        }else{
            changedStatus = 0;
        }

    }else if (updateType == "breakfast"){
        sql = `UPDATE tickets SET breakfast = ? WHERE ticket_id = ?`;
        if(brkfstStatus == "0"){
            changedStatus = 1;
        }else{
            changedStatus = 0;
        }

    }else if (updateType == "lunch"){
        sql = `UPDATE tickets SET lunch = ? WHERE ticket_id = ?`;
        if(lunchStatus == "0"){
            changedStatus = 1;
        }else{
            changedStatus = 0;
        }

    }else{
        console.log("err");
    }

    

    con.query(sql, [changedStatus, ticketNo], function (err, result) {
        if (err){
            console.log(err);
            res.status(500).json({
                message: 'Updating A Ticket Record Failed!'
            });
        }else{
            var sql = `SELECT * FROM tickets WHERE ticket_id= ?`;

            con.query(sql, [ticketNo], function (err, result) {
                if (err){
                    console.log(err);
                    res.status(500).json({
                        message: 'Getting A Ticket Record Failed!'
                    });
                }else{
                    console.log("Result",result[0]);
                    
                    res.render("ticketStatus", {
                        fname: result[0].fname,
                        lname: result[0].lname,
                        email: result[0].email,
                        ticketNo: result[0].ticket_id,
                        entryStatus: result[0].entry,
                        brkfstStatus: result[0].breakfast,
                        lunchStatus: result[0].lunch
                    });
                    
                
                } 
                //console.log(result);
            });
        } 
        //console.log(result);
    });


//     var sql = `SELECT * FROM tickets WHERE ticket_id= ?`;

//     con.query(sql, [ticketNo], function (err, result) {
//       if (err){
//           console.log(err);
//           res.status(500).json({
//               message: 'Getting A Ticket Record Failed!'
//           });
//       }else{
//         console.log("Result",result[0]);
         
//         res.render("ticketStatus", {
//             fname: result[0].fname,
//             lname: result[0].lname,
//             email: result[0].email,
//             ticketNo: result[0].ticket_id,
//             entryStatus: result[0].entry,
//             brkfstStatus: result[0].breakfast,
//             lunchStatus: result[0].lunch
//           });
        
       
//       } 
//       //console.log(result);
//   });
});

app.listen(port, console.log(`Listening on port ${port}`));