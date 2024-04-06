const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const SALT_WORK_FACTOR = 10;

const userModel = mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: {
      type: String,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      required: true,
      unique: true,
    },
    password: { type: String, required: true, trim: true },
    pic: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
  },
  {
    timestamps: true,
  }
);

userModel.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userModel.pre("save", function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

userModel.virtual('id').get(function(){
  return this._id;
});

userModel.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
}
});

const User = mongoose.model("User", userModel);
module.exports = User;
