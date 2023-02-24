const express = require("express")
const app = express()
app.use(express.json())

const userconfig = require("./api/userconfig");
app.use("/api/userconfig", userconfig);

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`porta aberta em ${PORT}`))