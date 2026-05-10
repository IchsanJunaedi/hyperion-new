<?php

namespace App\Http\Controllers;

use App\Models\Join;
use Illuminate\Http\Request;

class JoinController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:256',
            'email' => 'required|email|unique:joins,email',
            'age' => 'required|integer|min:1|max:100',
            'school' => 'required|string|max:256',
        ]);

        Join::create($validated);

        return redirect()->back()->with('success', 'Thank you for joining!');
    }
}
