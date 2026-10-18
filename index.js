import express from 'express';

const app = express();

app.use(express.static('artifyph'));
app.listen(3000, () => {
    console.log("test")
})
