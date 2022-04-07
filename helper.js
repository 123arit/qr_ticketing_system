


function download(fname, lname, email, qr_code) {
    //function body
    const html = `<h1>Noboborsho 2022 - GDL, Mexico</h1>
    <h2>Ticket for ${fname} ${lname}</h2>
    <h2>Email: ${email}</h2>
    <img src=${qr_code} alt="QR Code">`

    pdf.create(html, options).toFile('./pdfname.pdf', (err, res) => {
        if (err) {
          console.log(err);
        }
    });

}
function common2(key) {
    //function body
}
module.exports = {
    download: download,
    common2: common2
}