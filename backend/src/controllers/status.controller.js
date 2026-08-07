export const checkStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is up and running',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date()
  });
};
