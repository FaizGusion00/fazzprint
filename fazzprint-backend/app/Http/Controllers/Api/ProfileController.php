<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    /**
     * Upload or update the authenticated user's profile image.
     */
    public function uploadProfileImage(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'profile_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid image upload',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('profile_image');
        $filename = 'user_' . $user->user_id . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
        
        // Store file in the public disk explicitly
        $path = $file->storeAs('profile_images', $filename, 'public');

        // Delete old image if exists
        if ($user->profile_image) {
            Storage::disk('public')->delete('profile_images/' . basename($user->profile_image));
        }

        // Update user profile_image field (store relative path)
        $user->profile_image = 'profile_images/' . $filename;
        $user->save();

        // Generate the correct public URL
        $publicUrl = Storage::disk('public')->url('profile_images/' . $filename);

        return response()->json([
            'success' => true,
            'message' => 'Profile image updated successfully',
            'profile_image_url' => $publicUrl,
        ]);
    }
}
