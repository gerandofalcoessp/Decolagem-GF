module.exports = function handler(req, res) {
  return res.status(200).json({ message: 'Test endpoint working!' });
};