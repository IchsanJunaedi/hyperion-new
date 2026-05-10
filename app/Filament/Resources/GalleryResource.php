<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GalleryResource\Pages;
use App\Filament\Resources\GalleryResource\RelationManagers;
use App\Models\Gallery;
use Filament\Forms;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\ToggleButtons;
use Filament\Forms\Form;
use Filament\Forms\Set;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Str;

class GalleryResource extends Resource
{
    protected static ?string $model = Gallery::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?int $navigationSort = 4;

    protected static ?string $navigationGroup = 'Content Management';

    protected static ?string $label = 'Gallery Section';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make()
                    ->schema([
                        Grid::make([
                            'default' => 1,
                            'sm' => 2
                        ])
                            ->schema([
                                Forms\Components\Select::make('division_id')
                                    ->relationship('division', 'title')
                                    ->required(),
                                Forms\Components\TextInput::make('title')
                                    ->unique(ignoreRecord: true)
                                    ->required()
                                    ->maxValue(256)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn(Set $set, ?string $state) => $set('slug', Str::slug($state))),
                                Forms\Components\TextInput::make('slug')
                                    ->required()
                                    ->unique(ignoreRecord: true)
                                    ->maxLength(300)
                                    ->readOnly()
                                    ->helperText('Slug terisi otomatis setelah mengisi title'),
                                Forms\Components\DatePicker::make('tournament_date')
                                    ->required(),
                                Forms\Components\TextInput::make('position')
                                    ->required()
                                    ->numeric()
                                    ->maxValue(99),
                                ToggleButtons::make('status')
                                    ->required()
                                    ->inline()
                                    ->options([
                                        'online' => 'Online',
                                        'offline' => 'Offline',
                                    ]),
                                Forms\Components\RichEditor::make('description')
                                    ->required()
                                    ->maxLength(8192)
                                    ->columnSpanFull()
                                    ->disableToolbarButtons([
                                        'codeblock',
                                        'attachFiles',
                                        'link'
                                    ]),
                            ])
                    ]),
                Section::make()
                    ->schema([
                        Forms\Components\FileUpload::make('logo')
                            ->image()
                            ->maxSize(2048)
                            ->directory('galleries_logo')
                            ->helperText('Unggah maksimal 1 gambar. Hanya file gambar yang diperbolehkan (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB per file.'),
                    ]),
                Section::make()
                    ->schema([
                        Forms\Components\FileUpload::make('preview_images')
                            ->image()
                            ->multiple()
                            ->directory('preview_galleries')
                            ->required()
                            ->maxSize(2048)
                            ->minFiles(1)
                            ->maxFiles(4)
                            ->helperText('Unggah minimal 1 gambar dan maksimal 4 gambar. Hanya file gambar yang diperbolehkan (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB per file.'),
                    ]),
                Section::make()
                    ->schema([
                        Forms\Components\FileUpload::make('images')
                            ->image()
                            ->required()
                            ->multiple()
                            ->directory('galleries')
                            ->minFiles(1)
                            ->maxSize(2048)
                            ->maxFiles(10)
                            ->helperText('Unggah minimal 1 gambar dan maksimal 10 gambar. Hanya file gambar yang diperbolehkan (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB per file.'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('No')
                    ->rowIndex(),
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->limit(50),
                Tables\Columns\TextColumn::make('tournament_date')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('division.title')
                    ->searchable(),
                Tables\Columns\TextColumn::make('position')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('status'),
                Tables\Columns\ImageColumn::make('preview_images')
                    ->limit(4),
                Tables\Columns\ImageColumn::make('logo'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGalleries::route('/'),
            'create' => Pages\CreateGallery::route('/create'),
            'view' => Pages\ViewGallery::route('/{record}'),
            'edit' => Pages\EditGallery::route('/{record}/edit'),
        ];
    }
}
