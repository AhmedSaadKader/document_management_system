import mongoose from 'mongoose';

/**
 * @constant {mongoose.Schema} favoriteSchema - The schema definition for the Favorite model.
 * @description Defines the structure of the Favorite collection in the database.
 */
const favoriteSchema = new mongoose.Schema({
  /**
   * The ID of the user who favorited the workspace.
   * @type {string}
   * @required
   */
  userId: { type: String, required: true },

  /**
   * The ID of the workspace that is favorited.
   * @type {mongoose.Schema.Types.ObjectId}
   * @required
   * @ref 'Workspaces'
   */
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspaces',
    required: true,
  },

  /**
   * The date and time when the workspace was favorited.
   * @type {Date}
   * @default Date.now
   */
  favoritedAt: { type: Date, default: Date.now },
});

/**
 * @constant {mongoose.Model} Favorite - The Mongoose model for the Favorite schema.
 * @description Used to interact with the Favorites collection in the database.
 */
const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
