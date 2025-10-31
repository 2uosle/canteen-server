// Generate bcrypt hash for default booth passwords
const bcrypt = require('bcryptjs');

const password = 'counter123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('\n=== Bcrypt Hash Generated ===');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in the SQL script.');
  console.log('=============================\n');
});
