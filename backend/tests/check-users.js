const mongoose = require('mongoose');

// User schema (simplified)
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
  status: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/auth-saas-dev');
    console.log('Connected to MongoDB');
    
    const users = await User.find({}).select('username email role status');
    console.log('\nAvailable users:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers(); 