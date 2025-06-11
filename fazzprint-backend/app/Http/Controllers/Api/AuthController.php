<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Register a new customer
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_name' => 'required|string|max:255|unique:users',
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone_number' => 'required|string|max:20|unique:users',
            'address' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'user_name' => $request->user_name,
                'full_name' => $request->full_name,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'address' => $request->address,
                'password' => Hash::make($request->password),
                'role' => User::ROLE_CUSTOMER, // Default role for registration
            ]);

            // Create access token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => [
                        'user_id' => $user->user_id,
                        'user_name' => $user->user_name,
                        'full_name' => $user->full_name,
                        'email' => $user->email,
                        'phone_number' => $user->phone_number,
                        'role' => $user->role,
                        'profile_image' => $user->profile_image,
                        'profile_image_url' => $user->profile_image_url,
                    ],
                    'access_token' => $token,
                    'token_type' => 'Bearer'
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user with multiple credential options
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string', // Can be email, username, or phone
            'password' => 'required|string',
            'remember_me' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $login = $request->login;
        $password = $request->password;

        // Determine login type and find user
        $user = null;
        
        if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
            // Login with email
            $user = User::where('email', $login)->first();
        } elseif (preg_match('/^[0-9]{8,15}$/', $login)) {
            // Login with phone number (local format)
            $user = User::where('phone_number', $login)->first();
        } else {
            // Login with username
            $user = User::where('user_name', $login)->first();
        }

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Create access token
        $tokenName = $request->remember_me ? 'remember_token' : 'auth_token';
        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'user_id' => $user->user_id,
                    'user_name' => $user->user_name,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'role' => $user->role,
                    'profile_image' => $user->profile_image,
                    'profile_image_url' => $user->profile_image_url,
                ],
                'access_token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    /**
     * Get authenticated user profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'user_id' => $user->user_id,
                    'user_name' => $user->user_name,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'address' => $user->address,
                    'role' => $user->role,
                    'profile_image' => $user->profile_image,
                    'profile_image_url' => $user->profile_image_url,
                    'created_at' => $user->created_at,
                ]
            ]
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->user_id . ',user_id',
            'phone_number' => 'sometimes|string|max:20|unique:users,phone_number,' . $user->user_id . ',user_id',
            'address' => 'sometimes|string',
            'current_password' => 'required_with:new_password|string',
            'new_password' => 'sometimes|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check current password if new password is provided
            if ($request->filled('new_password')) {
                if (!Hash::check($request->current_password, $user->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Current password is incorrect'
                    ], 422);
                }
                $user->password = Hash::make($request->new_password);
            }

            // Update other fields
            $user->fill($request->only(['full_name', 'email', 'phone_number', 'address']));
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'user' => [
                        'user_id' => $user->user_id,
                        'user_name' => $user->user_name,
                        'full_name' => $user->full_name,
                        'email' => $user->email,
                        'phone_number' => $user->phone_number,
                        'address' => $user->address,
                        'role' => $user->role,
                        'profile_image' => $user->profile_image,
                        'profile_image_url' => $user->profile_image_url,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Profile update failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout user (revoke current token)
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            // Revoke current token
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout from all devices (revoke all tokens)
     */
    public function logoutAll(Request $request): JsonResponse
    {
        try {
            // Revoke all tokens
            $request->user()->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out from all devices successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if current password is correct
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            // Update password
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to change password',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if user has specific role
     */
    public function checkRole(Request $request, $role): JsonResponse
    {
        $user = $request->user();
        $hasRole = $user->role === $role;

        return response()->json([
            'success' => true,
            'data' => [
                'has_role' => $hasRole,
                'user_role' => $user->role,
                'requested_role' => $role
            ]
        ]);
    }

    /**
     * Get user settings
     */
    public function getSettings(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get settings from user preferences or use defaults
            $settings = [
                'items_per_page' => $user->settings['items_per_page'] ?? 20,
                'auto_refresh' => $user->settings['auto_refresh'] ?? true,
                'auto_refresh_interval' => $user->settings['auto_refresh_interval'] ?? 30,
                'session_timeout' => $user->settings['session_timeout'] ?? 30,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'settings' => $settings
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user settings
     */
    public function updateSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items_per_page' => 'required|integer|in:10,20,50,100',
            'auto_refresh' => 'required|boolean',
            'auto_refresh_interval' => 'required|integer|in:15,30,60,300',
            'session_timeout' => 'required|integer|in:0,15,30,60,120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            
            // Update user settings
            $settings = $request->only(['items_per_page', 'auto_refresh', 'auto_refresh_interval', 'session_timeout']);
            
            // Store settings in user model (assuming settings column exists)
            $user->settings = array_merge($user->settings ?? [], $settings);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
                'data' => [
                    'settings' => $settings
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
