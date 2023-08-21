const express = require("express")
const app = express();

app.get("/", (req,res) => {
    res.send({
        message: "Hello World!"
    })
})

app.listen(3020, () => {
    console.log("Listening on port 3020")
})


