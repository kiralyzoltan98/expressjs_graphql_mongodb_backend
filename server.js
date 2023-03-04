require('dotenv').config()
const express = require('express')
const app = express()
const expressGraphQL = require('express-graphql').graphqlHTTP

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInt,
} = require('graphql')

const Author = require('./models/author');
const Book = require('./models/book');

const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: 'This represents an author of a book',
    fields: () => ({
        id: { type: GraphQLInt },
        name: { type: GraphQLNonNull(GraphQLString) },
        books: {
            type: GraphQLList(BookType),
            resolve: async (author) => {
                return await Book.find({ authorId: author.id });
            }
        }
    })
})

const BookType = new GraphQLObjectType({
    name: 'Book',
    description: 'This represents a book written by an author',
    fields: () => ({
        id: { type: GraphQLInt },
        name: { type: GraphQLNonNull(GraphQLString) },
        authorId: { type: GraphQLNonNull(GraphQLInt) },
        author: {
            type: AuthorType,
            resolve: async (book) => {
                return await Author.findOne({id: book.authorId});
            }
        },
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        book: {
            type: BookType,
            description: 'A Single Book',
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: async (parent, args) => {
                return await Book.findOne({ id: args.id})
            }
        },
        books: {
            type: GraphQLList(BookType),
            description: 'List of All Books',
            resolve: async () => {
                return await Book.find();
            }
        },
        author: {
            type: AuthorType,
            description: 'A Single Author',
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: async (parent, args) => { 
                return await Author.findOne({ id: args.id})
            }
        },
        authors: {
            type: GraphQLList(AuthorType),
            description: 'List of All Authors',
            resolve: async () => {
                return await Author.find()
            }
        },
    })
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => ({
        addBook: {
            type: BookType,
            description: 'Add a book',
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                authorId: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: async (parent, args) => {
                const author = await Author.findOne({ id: args.authorId})
                if (!author) {
                    throw new Error(`Author with ID ${args.authorId} does not exist.`)
                }
                const book = new Book({
                    name: args.name,
                    authorId: args.authorId
                })
                await book.save()
                return book.toObject()
            }
        },
        addAuthor: {
            type: AuthorType,
            description: 'Add an author',
            args: {
                name: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: async (parent, args) => {
                const author = new Author({
                    name: args.name
                })
                await author.save()
                return author.toObject()
            }
        },
    })
})

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

app.use('/graphql', expressGraphQL({
    schema: schema,
    graphiql: true
}))
app.listen(5000., () => console.log('Server started on port 5000'))