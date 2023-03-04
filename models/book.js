const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true},
    name: { type: String, required: true },
    authorId: { type: Number, ref: 'Author' }
});

module.exports = mongoose.model('Book', bookSchema);