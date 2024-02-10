import { config } from "../config/auth.config.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import { url } from "../url.js";

export const signup = (req, res) => {
  console.log(req.body);
  // Save User to Database
  axios
    .get(url + "/users/", {
      params: {
        email: req.body.email,
      },
    })
    .then((response) => {
      if (response.data.length != 0) {
        console.log("theres already");
        res.status(400).send({
          message: "There is already an account with this email.",
        });
        return;
      } else {
        axios
          .post(url + "/users/", {
            name: req.body.name,
            email: req.body.email,
            ownedLists: [],
            invitedLists: [],
            password: bcrypt.hashSync(req.body.password, 8),
          })
          .then((response) => {
            console.log(response);
            res.send({ message: "User was registered successfully!" });
          })
          .catch((err) => {
            res.status(500).send({ message: err.message });
          });
      }
    });
};

export const signin = (req, res) => {
  axios
    .get(url + "/users/", {
      params: {
        email: req.body.email,
      },
    })
    .then((response) => {
      console.log(response.data);
      if (response.data.length == 0) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        response.data[0].password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!",
        });
      }

      const token = jwt.sign({ id: response.data[0].id }, config, {
        algorithm: "HS256",
        allowInsecureKeySizes: true,
        expiresIn: 86400, // 24 hours
      });

      res.status(200).send({
        id: response.data[0].id,
        name: response.data[0].name,
        email: response.data[0].email,
        ownedLists: response.data[0].ownedLists,
        invitedLists: response.data[0].invitedLists,
        accessToken: token,
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
