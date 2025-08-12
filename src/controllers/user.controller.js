import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { upload } from '../middlewares/multer.middleware.js';

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;

    if (
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    const avatarLocalPath = q.files?.avatar[0]?.path;
    const coverImageLocalPath = q.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if(!avatar) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : "",
        password
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})

export { registerUser };