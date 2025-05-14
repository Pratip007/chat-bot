// User Creation Endpoint with duplicate check
app.post('/api/user', async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    if (!userId || !name || !email) {
      return res.status(400).json({ error: 'userId, name, and email are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ userId: userId });
    
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user if doesn't exist
    const newUser = new User({ userId, name, email });
    await newUser.save();
    
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 