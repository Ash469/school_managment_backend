const Admin = require('../models/Admin');

/**
 * Generate a unique school ID in format SCH001-SCH99999
 * @returns {Promise<string>} Generated school ID
 */
const generateSchoolId = async () => {
  let schoolId;
  let isUnique = false;
  let counter = 1;

  while (!isUnique && counter <= 99999) {
    const paddedNumber = counter.toString().padStart(3, '0');
    schoolId = `SCH${paddedNumber}`;
    
    const existingAdmin = await Admin.findOne({ schoolId });
    if (!existingAdmin) {
      isUnique = true;
    } else {
      counter++;
    }
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique school ID');
  }

  return schoolId;
};

module.exports = { generateSchoolId };
