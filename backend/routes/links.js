const express = require("express");
const admin = require("../firebase/admin");
const verifyToken = require("../middleware/auth");
const { extractMetadata } = require("../services/metadata");

const router = express.Router();
const db = admin.database();

router.use(verifyToken);

router.post("/preview", async (req, res) => {
  try {
    if (!req.body.url) return res.status(400).json({ error: "URL is required" });
    res.json(await extractMetadata(req.body.url));
  } catch (error) {
    console.error("Link preview error:", error.message);
    res.status(422).json({ error: `Could not read this website: ${error.message}` });
  }
});

// Return all public links plus the signed-in user's own links. The likes node
// is joined here so the frontend knows which cards the current user has liked.
router.get("/", async (req, res) => {
  try {
    const [linksSnapshot, likesSnapshot] = await Promise.all([
      db.ref("links").once("value"),
      db.ref("likes").once("value"),
    ]);

    const links = linksSnapshot.val() || {};
    const likes = likesSnapshot.val() || {};
    const result = Object.entries(links)
      .map(([id, link]) => ({
        id,
        ...link,
        likedByMe: Boolean(likes[id] && likes[id][req.user.uid]),
      }))
      .filter((link) => link.isPublic !== false || link.userId === req.user.uid)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json(result);
  } catch (error) {
    console.error("Read links error:", error.message);
    res.status(500).json({ error: "Could not load links" });
  }
});

router.post("/", async (req, res) => {
  const { url, isPublic = true } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const metadata = await extractMetadata(url);
    const user = await admin.auth().getUser(req.user.uid);
    const ref = db.ref("links").push();
    const link = {
      url: metadata.url,
      title: req.body.title || metadata.title,
      caption: req.body.caption || metadata.caption,
      domain: metadata.domain,
      siteName: req.body.siteName || metadata.siteName,
      logo: metadata.logo,
      image: metadata.image,
      isPublic: Boolean(isPublic),
      likes: 0,
      comments: 0,
      profilePicture: user.photoURL || "",
      timestamp: admin.database.ServerValue.TIMESTAMP,
      userEmail: req.user.email,
      userId: req.user.uid,
      userName: user.displayName || req.user.email.split("@")[0],
    };
    await ref.set(link);
    const saved = (await ref.once("value")).val();
    res.status(201).json({ id: ref.key, ...saved, likedByMe: false });
  } catch (error) {
    console.error("Create link error:", error.message);
    res.status(400).json({ error: "Could not save this link" });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const linkRef = db.ref(`links/${req.params.id}`);
    if (!(await linkRef.once("value")).exists()) return res.status(404).json({ error: "Link not found" });

    const likeRef = db.ref(`likes/${req.params.id}/${req.user.uid}`);
    const liked = (await likeRef.once("value")).exists();
    await likeRef.set(liked ? null : true);
    const countSnapshot = await db.ref(`likes/${req.params.id}`).once("value");
    const count = countSnapshot.numChildren();
    await linkRef.child("likes").set(count);
    res.json({ liked: !liked, likes: count });
  } catch (error) {
    console.error("Like link error:", error.message);
    res.status(500).json({ error: "Could not update like" });
  }
});

module.exports = router;
