// IMPORT DES PACKAGES
const express = require("express");
const formidableMiddleware = require("express-formidable");
const cloudinary = require("cloudinary").v2;
const router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated");

const app = express();
app.use(formidableMiddleware());
app.use(isAuthenticated);

//IMPORT DU MODEL
const Offer = require("../models/Offer");

// ROUTE POST OFFER PUBLISH
router.post("/offers/publish", isAuthenticated, async (req, res) => {
  try {
    if (req.fields.price > 100000) {
      res.status(400).json({ message: "Too expensive" }); // LIMITE DU PRIX
    } else if (req.fields.description.length > 500) {
      res.status(400).json({ message: "There's to many characters.." }); // LIMITE DE CHARACTERES DANS LA DESCRIPTION
    } else if (req.fields.title.length > 50) {
      res.status(400).json({ message: "You're title is too long.." }); // LIMITE DE CHARACTERE DANS LE TITRE
    } else if (req.fields.title && req.fields.price && req.fields.city) {
      // RECUPERATION DES INFOS (Fields)
      const {
        title,
        description,
        price,
        condition,
        city,
        brand,
        size,
        color,
      } = req.fields;
      // LA NOUVELLE OFFRE
      const offer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
            TAILLE: size,
            ETAT: condition,
            COULEUR: color,
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });
      // UPLOAD DE L'IMAGE AVEC L'ID DE LA NOUVELLE OFFRE.
      let pictureToUpload = req.files.picture.path; // recupération du chemin de l'image
      // upload sur Cloudinary
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `/vinted/offers/${offer.product_name}`,
        public_id: offer.id,
      });
      // AJOUT DES INFOS DE L'IMAGE DANS LA NOUVELLE OFFRE
      const picture = result;
      offer.product_image = picture;
      //SAUVEGARDE
      await offer.save();
      // RÉPONSE SANS LES HASH,SALT..
      res.json(offer);
    }
  } catch (error) {
    return res.json({ error: error.message });
  }
});

// ROUTE PUT (UPDATE AN OFFER)
router.put("/offers/update", async (req, res) => {
  try {
    // récupération des infos(fields)
    const id = req.fields.id;
    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
      picture,
    } = req.fields;
    // retrouver l'offre concernée
    const offerToUp = await Offer.findById(id);
    // les conditions de changements.
    if (title) {
      offerToUp.product_name = title;
    }
    if (description) {
      offerToUp.product_description = description;
    }
    if (price) {
      offerToUp.product_price = price;
    }
    if (condition) {
      offerToUp.product_details = [{ ETAT: condition }];
    }
    if (city) {
      offerToUp.product_details = [{ EMPLACEMENT: city }];
    }
    if (brand) {
      offerToUp.product_details = [{ MARQUE: brand }];
    }
    if (size) {
      offerToUp.product_details = [{ TAILLE: size }];
    }
    if (color) {
      offerToUp.product_details = [{ COULEUR: color }];
    }
    if (picture) {
      // UPLOAD DE L'IMAGE AVEC L'ID DE LA NOUVELLE OFFRE.

      let pictureToUpload = req.files.picture.path; // infos de l'image

      //upload sur cloudinary
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `/vinted/offers/${offer.product_name}`,
        public_id: offer.id,
      });
      // AJOUT DES INFOS DE L'IMAGE DANS LA NOUVELLE OFFRE
      const picture = result;
      offerToUp.product_image = picture;
    }
    //sauvegarde
    await offerToUp.save();
    //reponse
    res.status(200).json({ message: "Offer updated." });
  } catch (error) {
    console.log({ message: error.message });
  }
});

// ROUTE DELETE (DELETE AN OFFER)
router.delete("/offers/delete", async (req, res) => {
  try {
    // Récupération de l'id
    const id = req.fields.id;

    //recherche de l'offre concernée et suppression
    const offerToDelete = await Offer.findByIdAndDelete(id);
    cloudinary.api.delete_resources("vinted/offers/" + id);
    //reponse
    res.status(200).json({ message: "Offer deleted" });
  } catch (error) {
    console.log({ message: error.message });
  }
});

// ROUTE GET (RECHERCHE AVEC PLUSIEURS CRITERES)
router.get("/offers", async (req, res) => {
  try {
    let { title, priceMin, priceMax, page } = req.query;
    let sort;
    let count = 0;

    // INITIALISATION DE MES QUERY SI ELLES SONT ABSENTES.
    if (!priceMin) {
      priceMin = 0;
    }
    if (!priceMax) {
      priceMax = 100000;
    }
    if (!page) {
      page = 1;
    }
    if (req.query.sort === "price-desc") {
      sort = -1;
    } else if (req.query.sort === "price-asc") {
      sort = 1;
    }
    // MON COMPTEUR
    let allProducttomycounter = await Offer.find({
      product_name: new RegExp(title, "i"),
      product_price: { $gte: priceMin },
    })
      .select("product_name product_description product_price")
      .sort({ product_price: sort });

    count = allProducttomycounter.length; // RESULTAT DE MON COMPTEUR

    //RESULTAT DE MA RECHERCHE

    const limit = 3; // ARTICLES PAR PAGES
    const skip = limit * page - limit; // LE SKIP

    let allProduct = await Offer.find({
      product_name: new RegExp(title, "i"),
      product_price: { $gte: priceMin },
    })
      .select("product_name product_description product_price")
      .sort({ product_price: sort })
      .limit(limit)
      .skip(skip);

    res.json({ count, allProduct });
  } catch (error) {
    console.log({ message: error.message });
  }
});

// ROUTE GET (RECHERCHE BY ID)
router.get("/offers/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Offer.findById(id);
    res.status(200).json(result);
  } catch (error) {
    console.log({ message: error.message });
  }
});

module.exports = router;
