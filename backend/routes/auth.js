// ✅ REGISTER — create account then send OTP (no token yet)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('================================');
    console.log('REGISTER REQUEST RECEIVED');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('================================');

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('User already exists');
      return res.status(400).json({
        message: 'Email already exists'
      });
    }

    console.log('Hashing password...');

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Creating user in MongoDB...');

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    console.log('User created successfully');
    console.log('User ID:', user._id);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000
    };

    console.log('OTP generated:', otp);
    console.log('Sending OTP email...');

    // Send email
    await sendOTP(email, otp);

    console.log('OTP email sent successfully');

    return res.status(201).json({
      message: 'Account created. OTP sent to your email.'
    });

  } catch (err) {
    console.error('================================');
    console.error('REGISTER ERROR');
    console.error(err);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('================================');

    return res.status(500).json({
      message: err.message || 'Registration failed'
    });
  }
});