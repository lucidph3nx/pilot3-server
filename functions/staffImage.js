const fs = require('fs');
const staffImgPath = './data/img/staff';

module.exports = function(staffId) {
    let response = '';
    fs.readdirSync(staffImgPath).forEach((file) => {
        currentStaffId = file.split(' - ')[0];
        if (staffId == currentStaffId) {
            response = (staffImgPath + '/' + file);
        }
      });
      return response;
};
