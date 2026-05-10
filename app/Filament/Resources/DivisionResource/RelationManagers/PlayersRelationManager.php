<?php

namespace App\Filament\Resources\DivisionResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Components\ToggleButtons;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Str;

class PlayersRelationManager extends RelationManager
{
    protected static string $relationship = 'players';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxValue(255),
                Forms\Components\TextInput::make('nickname')
                    ->required()
                    ->maxValue(255),
                Forms\Components\TextInput::make('role')
                    ->required()
                    ->maxValue(255),
                Forms\Components\FileUpload::make('image')
                    ->required()
                    ->image()
                    ->maxSize(2048)
                    ->directory('players'),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('title')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->limit(50)
                    ->searchable(),
                Tables\Columns\TextColumn::make('nickname')
                    ->limit(50)
                    ->searchable(),
                Tables\Columns\TextColumn::make('role')
                    ->searchable(),
                Tables\Columns\ImageColumn::make('image')
                    ->circular(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
