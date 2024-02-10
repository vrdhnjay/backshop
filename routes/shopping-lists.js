import express from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { url } from "../url.js";

const router = express.Router();

const listsUrl = url + "/lists/";
const currentDate = new Date();

//List all lists
router.get("/", async (req, res) => {
  var lists = [];
  await (async () => {
    const allLists = await axios.get(url + "/lists/");
    lists = allLists.data;
  })();
  const perChunk = req.query.pageSize;
  if (perChunk == 0) {
    res.json(lists);
  } else {
    console.log(perChunk);
    const result = lists.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / perChunk);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);
    res.send(result[req.query.pageIndex]);
  }
});

//List all lists of a user
router.get("/lsuser", async (req, res) => {
  var lists = [];
  var invitedListsIds = [];
  var invitedLists = [];
  await (async () => {
    const allLists = await axios.get(url + "/lists/", {
      params: {
        ownerId: req.query.owner,
      },
    });
    const invited = await axios.get(url + "/users/", {
      params: {
        id: req.query.owner,
      },
    });
    invitedListsIds = invited.data[0].invitedLists;
    lists = allLists.data;
    if (invitedListsIds.length != 0) {
      for (let i = 0; i < invitedListsIds.length; i++) {
        const list = invitedListsIds[i];
        const allInvited = await axios.get(url + "/lists/" + list);
        invitedLists.push(allInvited.data);
      }
    }
  })();
  const perChunk = req.query.pageSize;
  if (perChunk == 0) {
    res.json({
      lists,
      invitedLists,
    });
  } else {
    console.log(perChunk);
    const result = lists.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / perChunk);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);
    res.send({
      lists: result[req.query.pageIndex],
      invitedLists: invitedLists,
    });
  }
});

//Get shopping list by ID
router.get("/getsl", (req, res) => {
  const id = req.query.id;
  axios
    .get(url + "/lists/" + id)
    .then(function (response) {
      // handle success
      console.log(req.query.ownerId);
      console.log(response.data.members);
      console.log();
      if (response.data.length == 0) {
        res.status(404);
        res.json({});
      } else if (
        response.data.ownerId == req.query.ownerId ||
        response.data.members.findIndex(
          (singleMember) => singleMember.id == req.query.ownerId
        ) != -1
      ) {
        res.json(response.data);
      } else {
        res.status(404);
        res.json({});
      }
    })
    .catch(function (error) {
      // handle error
      res.status(404);
      res.json({});
    });
});

//Update shopping list name
router.patch("/nameupdate", (req, res) => {
  const id = req.body.id;
  const newName = req.body.name;
  axios
    .patch(url + "/lists/" + id, { name: newName })
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      res.status(500);
      res.json({});
    });
});

//Delete shopping list
router.post("/delete", (req, res) => {
  const id = req.body.id;
  const ownerId = req.body.ownerId;
  const members = req.body.members;
  axios
    .delete(listsUrl + id)
    .then((response) => {
      axios.get(url + "/users/" + ownerId).then((userResponse) => {
        axios.patch(url + "/users/" + ownerId, {
          ownedLists: userResponse.data.ownedLists.filter(function (e) {
            return e !== id;
          }),
        });
        if (members.length > 0) {
          for (let i = 0; i < members.length; i++) {
            const member = members[i];
            axios
              .get(url + "/users/" + member.id)
              .then((singleMemberResponse) => {
                axios.patch(url + "/users/" + member.id, {
                  invitedLists: singleMemberResponse.data.invitedLists.filter(
                    function (e) {
                      return e !== id;
                    }
                  ),
                });
              });
          }
        }
        res.send("deleted");
      });
    })
    .catch((error) => {
      console.log(error);
      res.json({});
    });
});

//Update shopping list archive status
router.patch("/archiveupdate", (req, res) => {
  const id = req.body.id;
  const newArchived = req.body.archived;
  axios
    .patch(url + "/lists/" + id, { archived: newArchived })
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      res.status(500);
      res.json({});
    });
});

//Add User to Shopping List
router.post("/adduser", async (req, res) => {
  const id = req.body.id;
  const userEmail = req.body.userEmail;
  axios
    .get(listsUrl + id)
    .then((response) => {
      axios
        .get(url + "/users/", {
          params: {
            email: userEmail,
          },
        })
        .then((memberResponse) => {
          if (memberResponse.data.length == 0) {
            res.status(404);
            res.json({
              message: "User not registered. Please ask them to sign up",
            });
          } else {
            console.log(
              response.data.members.findIndex(
                (singleMember) => singleMember.id == memberResponse.data[0].id
              )
            );
            if (
              response.data.members.findIndex(
                (singleMember) => singleMember.id == memberResponse.data[0].id
              ) == -1
            ) {
              axios
                .patch(url + "/lists/" + id, {
                  members: [
                    ...response.data.members,
                    {
                      id: memberResponse.data[0].id,
                      email: memberResponse.data[0].email,
                    },
                  ],
                })
                .then((resp) => {
                  axios
                    .patch(url + "/users/" + memberResponse.data[0].id, {
                      invitedLists: [
                        ...memberResponse.data[0].invitedLists,
                        id,
                      ],
                    })
                    .then((userEditResp) => {
                      if (userEditResp.status == 200) {
                        res.json(resp.data);
                      }
                    })
                    .catch((error) => {
                      res.status(500);
                      res.json({});
                    });
                })
                .catch((error) => {
                  res.status(500);
                  res.json({});
                });
            } else {
              res.status(409);
              res.json({});
            }
          }
        });
    })
    .catch((error) => {
      res.status(500);
      res.json({});
    });
});

//Remove User from Shopping List
router.delete("/removeuser", (req, res) => {
  const id = req.query.id;
  const userId = req.query.userId;
  axios
    .get(listsUrl + id)
    .then((response) => {
      if (
        response.data.members.findIndex(
          (singleMember) => singleMember.id == userId
        ) != -1
      ) {
        axios
          .patch(url + "/lists/" + id, {
            members: response.data.members.filter(function (e) {
              return e.id !== userId;
            }),
          })
          .then((resp) => {
            axios
              .get(url + "/users/" + userId)
              .then((userResponse) => {
                axios
                  .patch(url + "/users/" + userId, {
                    invitedLists: userResponse.data.invitedLists.filter(
                      function (e) {
                        return e !== id;
                      }
                    ),
                  })
                  .then((finalRes) => {
                    res.json(resp.data);
                  });
              })
              .catch((error) => {
                res.status(500);
                res.json({});
              });
          })
          .catch((error) => {
            res.status(500);
            res.json({});
          });
      } else {
        res.status(409);
        res.json({});
      }
    })
    .catch((error) => {
      res.status(500);
      res.json({});
    });
});

//Add Product to Shopping List
router.post("/addproduct", (req, res) => {
  const id = req.body.id;
  const product = req.body.product;
  axios
    .get(listsUrl + id)
    .then((response) => {
      axios
        .patch(url + "/lists/" + id, {
          products: [
            ...response.data.products,
            {
              id: uuidv4(),
              name: product,
              completed: false,
            },
          ],
        })
        .then((resp) => {
          res.json(resp.data);
        })
        .catch((error) => {
          res.status(500);
          res.json({});
        });
    })
    .catch((error) => {
      res.status(500);
      res.json({});
    });
});

//Update Product in Shopping List
router.patch("/updateproduct", (req, res) => {
  const id = req.body.id;
  const product = req.body.product;
  axios
    .get(listsUrl + id)
    .then((response) => {
      let productData = response.data.products;
      let objIndex = productData.findIndex((obj) => obj.id == product.id);
      if (objIndex == -1) {
        res.status(404);
        res.send("Product not found");
      } else {
        productData[objIndex] = product;
        axios
          .patch(url + "/lists/" + id, {
            products: productData,
          })
          .then((resp) => {
            res.json(resp.data);
          })
          .catch((error) => {
            res.status(500);
            res.json({});
          });
      }
    })
    .catch((error) => {
      res.status(500);
      res.json({});
    });
});

//Remove Product from Shopping List
router.delete("/removeproduct", (req, res) => {
  const id = req.query.id;
  const productId = req.query.productId;
  axios
    .get(listsUrl + id)
    .then((response) => {
      let productData = response.data.products;
      let objIndex = productData.findIndex((obj) => obj.id == productId);
      if (objIndex == -1) {
        res.status(404);
        res.send("Product not found");
      } else {
        axios
          .patch(url + "/lists/" + id, {
            products: productData.filter(function (e) {
              return e.id !== productId;
            }),
          })
          .then((resp) => {
            res.json(resp.data);
          })
          .catch((error) => {
            res.status(500);
            res.json({});
          });
      }
    })
    .catch((error) => {
      res.status(500);
      res.send("Shopping list not found");
    });
});

//Add a new shopping list
router.post("/", (req, res) => {
  if (req.body.name) {
    const toAdd = {
      awid: "222222222222222222222",
      name: req.body.name,
      ownerId: req.body.ownerId,
      ownerEmail: req.body.ownerEmail,
      members: [],
      products: [],
      archived: false,
      sys: {
        cts: currentDate.getTime(),
        mts: null,
        rev: 0,
      },
      id: uuidv4(),
    };
    axios
      .post(url + "/lists/", toAdd)
      .then(function (response) {
        res.json({ ...toAdd, uuAppErrorMap: {} });
      })
      .catch(function (error) {
        throw new Error({
          uuAppErrorMap: {
            "Failed to add":
              "There was some problem creating the shopping list",
          },
        });
      });
  } else {
    res.status(500);
    res.json({
      uuAppErrorMap: {
        "Failed to add": "There was some problem creating the shopping list",
      },
    });
  }
});

export default router;
