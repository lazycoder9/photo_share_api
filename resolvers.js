const { GraphQLScalarType } = require('graphql');
const { authorizeWithGithub } = require('./lib.js');

module.exports = {
  Query: {
    totalPhotos: (parent, args, { db }) => db.collection('photos').estimatedDocumentCount(),
    allPhotos: (parent, args, { db }) => db.collection('photos').find().toArray(),
    totalUsers: (parent, args, { db }) => db.collection('users').estimatedDocumentCount(),
    allUsers: (parent, args, { db }) => db.collection('users').find().toArray(),
    me: (parent, args, { currentUser }) => currentUser,
  },
  Mutation: {
    async postPhoto(_parent, args, { db, currentUser }) {
      if (!currentUser) {
        throw new Error('Only an authorized user can post a photo');
      }
      const newPhoto = {
        ...args.input,
        userID: currentUser.githubLogin,
        created: new Date(),
      };
      const { insertedIds } = await db.collection('photos').insert(newPhoto);
      newPhoto.id = insertedIds['0'];

      return newPhoto;
    },
    async githubAuth(_parent, { code }, { db }) {
      const { message, access_token, avatar_url, login, name } = await authorizeWithGithub({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
      });

      if (message) {
        throw new Error(message);
      }

      const latestUserInfo = {
        name,
        githubLogin: login,
        githubToken: access_token,
        avatar: avatar_url,
      };

      const {
        ops: [user],
      } = await db.collection('users').replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });

      return { user, token: access_token };
    },
  },
  Photo: {
    id: (parent) => parent.id || parent._id,
    url: (parent) => `/img/photos/${parent._id}.jpg`,
    postedBy: (parent, args, { db }) => db.collection('users').findOne({ githubLogin: parent.userID }),
    // taggedUsers: (parent) =>
    //   tags
    //     .filter((tag) => tag.photoID === parent.id)
    //     .map((tag) => tag.userID)
    //     .map((userID) => users.find((u) => u.githubLogin === userID)),
  },
  User: {
    postedPhotos: (parent) => photos.filter((p) => p.githubUser === parent.githubLogin),
    inPhotos: (parent) =>
      tags
        .filter((tag) => tag.userID === parent.id)
        .map((tag) => tag.photoID)
        .map((photoID) => photos.find((p) => p.id === photoID)),
  },
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'A valid date time value.',
    parseValue: (value) => new Date(value),
    serialize: (value) => new Date(value).toISOString(),
    parseLiteral: (ast) => ast.value,
  }),
};
