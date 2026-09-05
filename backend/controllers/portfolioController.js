import PortfolioItem from "../models/PortfolioItemModel.js";

export const getPortfolio = async (req, res) => {
  try {
    const owner = req.params.userId || req.user._id;
    const filter = req.params.userId ? { owner, verified: true } : { owner };
    const items = await PortfolioItem.find(filter).populate("verifiedBy", "name role").sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: "Unable to load portfolio", error: error.message });
  }
};

export const getPendingPortfolioItems = async (req, res) => {
  try {
    const items = await PortfolioItem.find({ verified: false })
      .populate("owner", "name email department rollNo institution")
      .populate("verifiedBy", "name role")
      .sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: "Unable to load pending portfolio items", error: error.message });
  }
};

export const addPortfolioItem = async (req, res) => {
  try {
    const item = await PortfolioItem.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ item });
  } catch (error) {
    res.status(400).json({ message: "Unable to add portfolio item", error: error.message });
  }
};

export const verifyPortfolioItem = async (req, res) => {
  try {
    const item = await PortfolioItem.findByIdAndUpdate(req.params.id, { verified: true, verifiedBy: req.user._id, verifiedAt: new Date() }, { new: true }).populate("verifiedBy", "name role");
    if (!item) return res.status(404).json({ message: "Portfolio item not found" });
    res.json({ item });
  } catch (error) {
    res.status(500).json({ message: "Unable to verify portfolio item", error: error.message });
  }
};