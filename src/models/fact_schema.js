const { model, Schema } = require("mongoose");

const factSchema = new Schema(
  {
    fact: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = model("Fact", factSchema);
