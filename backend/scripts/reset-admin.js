const bcrypt = require('bcryptjs');
const { AppDataSource } = require('../src/data-source');

(async () => {
  try {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository('AdminUser');
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    let user = await repo.findOne({ where: { username } });
    const passwordHash = await bcrypt.hash(password, 10);
    if (!user) {
      await repo.save({ username, passwordHash });
      console.log(`Created admin '${username}' with new password.`);
    } else {
      user.passwordHash = passwordHash;
      await repo.save(user);
      console.log(`Updated password for admin '${username}'.`);
    }
    await AppDataSource.destroy();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();


