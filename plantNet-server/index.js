require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

const port = process.env.PORT || 9000;
const app = express();
// middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y41ia.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // -------------COLLECTIONS-------------
    const db = client.db("plantNet");
    const usersCollection = db.collection("users");
    const plantsCollection = db.collection("plants");
    const ordersCollection = db.collection("orders");

    // -------------USER API-------------
    // save a user
    app.post("/users/:email", async (req, res) => {
      const email = req.params.email;
      const userData = req.body;

      // check if user already exists
      const isExist = await usersCollection.findOne({ email });
      if (isExist) {
        return res.send(isExist);
      }

      const result = await usersCollection.insertOne({
        ...userData,
        role: "Customer",
        timestamp: Date.now(),
      });
      res.send(result);
    });

    // ----MANAGE USER STATUS & ROLE---
    app.patch("/user/updateStatus/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      // find the user who requested
      const user = await usersCollection.findOne(query);
      if (!user || user?.status === "Requested") {
        res
          .status(400)
          .send(
            "You have already Requested. Please wait , Your status will be updated once requested Accepted"
          );
      }
      const updatedDoc = {
        $set: {
          status: "Requested",
        },
      };
      const result = await usersCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    //get user role
    app.get("/user/role/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send({ role: result?.role });
    });

    // -------------Generate jwt token-------------
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    // Logout
    app.get("/logout", async (req, res) => {
      try {
        res
          .clearCookie("token", {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
      } catch (err) {
        res.status(500).send(err);
      }
    });

    // -------------PLANTS-------------
    // save a plant data in db
    app.post("/add-plant", verifyToken, async (req, res) => {
      const plant = req.body;
      const result = await plantsCollection.insertOne(plant);
      res.send(result);
    });
    // get all plant data from db
    app.get("/plants", async (req, res) => {
      const result = await plantsCollection.find().toArray();
      res.send(result);
    });
    // get a plant by id
    app.get("/plant/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await plantsCollection.findOne(query);
      res.send(result);
    });

    //  -------------ORDERS API-------------
    // save order info
    app.post("/order", verifyToken, async (req, res) => {
      const orderInfo = req.body;
      const result = await ordersCollection.insertOne(orderInfo);
      res.send(result);
    });

    // manage plants quantity
    app.patch("/plant/quantity/:id", async (req, res) => {
      const id = req.params.id;
      const { quantityToUpdate, status } = req.body;
      const filter = { _id: new ObjectId(id) };

      let updatedDoc = {
        $inc: { quantity: -quantityToUpdate },
      };
      if (status === "increase") {
        updatedDoc = {
          $inc: { quantity: quantityToUpdate },
        };
      }
      const result = await plantsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // get orders
    app.get("/orders/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "customer.email": email };
      const result = await ordersCollection
        .aggregate([
          // Step 1: Find specific orders based on a query (e.g., user email)
          {
            $match: query, // Filters the orders collection to only include documents that match the query.
          },
          // Step 2: Convert the plantId field from a string to an ObjectId
          {
            $addFields: {
              plantId: { $toObjectId: "$plantId" }, // Ensures plantId is compatible with the ObjectId format in the referenced plants collection.
            },
          },
          // Step 3: Perform a lookup to join data from the plants collection
          {
            $lookup: {
              from: "plants", // Specifies the target collection to join with (plants).
              localField: "plantId", // Matches the plantId in the orders collection.
              foreignField: "_id", // Matches the _id in the plants collection.
              as: "plants", // Outputs the matching plants data into a field called "plants" as an array.
            },
          },
          // Step 4: Unwind the plants array to simplify the structure
          {
            $unwind: "$plants", // Converts the array (plants) into individual objects, assuming only one match per plantId.
          },
          // Step 5: Add only the required fields from the plants collection to the order object
          {
            $addFields: {
              name: "$plants.name", // Adds the name field from the plants collection.
              image: "$plants.image", // Adds the image field from the plants collection.
              category: "$plants.category", // Adds the category field from the plants collection.
            },
          },
          // Step 6: Remove the original plants field from the result
          {
            $project: {
              plants: 0, // Excludes the plants field from the final output.
            },
          },
        ])
        .toArray(); // Converts the aggregation result to an array.

      res.send(result);
    });

    // delete order by id
    app.delete("/cancelOrder/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      // prevent cancel if the order is delivered
      const order = await ordersCollection.findOne(query);
      if (order.status === "Delivered") {
        res.status(409).send("Order Cannot be cancelled once delivered");
      }

      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from plantNet Server..");
});

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`);
});
