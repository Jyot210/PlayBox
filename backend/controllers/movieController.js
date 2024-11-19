import Movie from "../models/Movie.js";
import uploadToCloudinary from "../utils/cloudinarySetup.js";

// Create Movie
const createMovie = async (req, res) => {
  try {
    const { name, year, genre, detail, cast, tier, rating } = req.body;

    // Check if files exist and handle missing files more gracefully
    if (!req.files || !req.files.image || !req.files.image[0]) {
      console.log(req.files, req.files.image, req.files.image[0]);
      return res.status(400).json({ message: "Image file is required." });
    }

    if (!req.files.video || !req.files.video[0]) {
      return res.status(400).json({ message: "Video file is required." });
    }

    const imageFile = req.files.image[0];
    const videoFile = req.files.video[0];

    // Upload both files to Cloudinary
    const [imageUpload, videoUpload] = await Promise.all([
      uploadToCloudinary(imageFile.buffer, "image"),
      uploadToCloudinary(videoFile.buffer, "video"),
    ]);

    // Create a new movie document with the uploaded URLs and additional details
    const movie = new Movie({
      name,
      image: imageUpload.secure_url,
      video: videoUpload.secure_url,
      rating,
      year,
      genre,
      detail,
      cast: cast ? cast.split(",").map((c) => c.trim()) : [], // Trimming each cast member
      tier: tier.split(",").map((t) => t.trim()), // Trimming each tier value
    });

    await movie.save();
    res
      .status(202)
      .json({ success: true, message: "Movie uploaded successfully", movie });
  } catch (error) {
    console.error("Error details:", error); // Logs detailed error
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Update Movie
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, genre, detail, cast, tier, rating } = req.body;

    // Find the movie by ID
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Prepare update object
    const updateFields = {
      name: name || movie.name,
      year: year || movie.year,
      rating: rating || movie.rating,
      genre: genre || movie.genre,
      detail: detail || movie.detail,
      cast: cast ? cast.split(",").map((c) => c.trim()) : movie.cast,
      tier: tier ? tier.split(",").map((t) => t.trim()) : movie.tier,
    };

    // Check if new image file is uploaded
    if (req.files && req.files.image && req.files.image[0]) {
      const imageFile = req.files.image[0];
      const imageUpload = await uploadToCloudinary(imageFile.buffer, "image");
      updateFields.image = imageUpload.secure_url;
    }

    // Check if new video file is uploaded
    if (req.files && req.files.video && req.files.video[0]) {
      const videoFile = req.files.video[0];
      const videoUpload = await uploadToCloudinary(videoFile.buffer, "video");
      updateFields.video = videoUpload.secure_url;
    }

    // Update the movie document with new values
    const updatedMovie = await Movie.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    res.json({
      success: true,
      message: "Movie updated successfully",
      updatedMovie,
    });
  } catch (error) {
    console.error("Error details:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all the available movies
const getAllMovies = async (req, res) => {
  try {
    // Get the user tier from the cookie
    const userTier = req.user.tier;

    if (!userTier) {
      return res.status(400).json({ error: "User tier not found in cookie" });
    }

    // Find movies that match the user's tier or a higher tier
    // This assumes a priority where 'platinum' > 'gold' > 'silver'
    let movies;
    if (userTier === "platinum") {
      movies = await Movie.find({
        tier: { $in: ["platinum", "gold", "silver"] },
      });
    } else if (userTier === "gold") {
      movies = await Movie.find({ tier: { $in: ["gold", "silver"] } });
    } else if (userTier === "silver") {
      movies = await Movie.find({ tier: "silver" });
    } else {
      return res.status(400).json({ error: "Invalid tier in cookie" });
    }
    // console.log("movies", movies);
    const data = movies;
    res.status(202).send(data);
  } catch (error) {
    // console.log("error", error);
    res.status(500).send(error.message);
  }
};

// Get any Perticular movies using movie Id
const getSpecificMovie = async (req, res) => {
  try {
    // access movie id from url parameter
    const { id } = req.params;
    const specificMovie = await Movie.findById(id);
    if (!specificMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json(specificMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a movie by its ID
const deleteMovie = async (req, res) => {
  try {
    // Extract the movie ID from request parameters
    const { id } = req.params;

    // Find the movie by ID and delete it from the database
    const deleteMovie = await Movie.findByIdAndDelete(id);

    if (!deleteMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json({success: true, message: "Movie Deleted Successfully" });
  } catch (error) {
    res.status(500).json({success: false, error: error.message });
  }
};

// Delete a specific comment/review from a movie
const deleteComment = async (req, res) => {
  try {
    // Extract the movie ID and review ID from the request body
    const { movieId, reviewId } = req.body;

    // Find the movie by ID in the database
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const reviewIndex = movie.reviews.findIndex(
      (r) => r._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Remove the review from the movie's reviews array and update
    movie.reviews.splice(reviewIndex, 1);
    movie.numReviews = movie.reviews.length;

    await movie.save();
    res.json({ message: "Comment Deleted Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export {
    createMovie,
    updateMovie,
    getAllMovies,
    getSpecificMovie,
    deleteMovie,
    deleteComment
  };