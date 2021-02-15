import express from 'express';
import mongoose from 'mongoose';
import Cors from 'cors';
import Pusher from 'pusher';

import Messages from "./dbMessages.js";

// app config
const app = express();
const port = process.env.PORT || 8001;

const pusher = new Pusher({
    appId: "1155873",
    key: "102039b1340aeec118f7",
    secret: "0d33699123239e5a1ec0",
    cluster: "ap2",
    useTLS: true
});

// middleware
app.use(express.json());
app.use(Cors());

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });

// DB config
const connection_url = "mongodb+srv://admin:RLHe9dUeJMkf8iz@cluster0.sebuh.mongodb.net/whatsappDb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
    // console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        // console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;

            // channel-name -> messages, event-name -> inserted
            pusher.trigger("messages", "inserted", 
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                }
            );
        } else {
            console.log('Error trigerring Pusher');
        }
    });
});

// api routes
app.get("/", (req, res) => {
    res.status(200).send("WOAHHHHH!!")
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    })
});

// listen
app.listen(port, () => console.log(`listening on localhost: ${port}`));