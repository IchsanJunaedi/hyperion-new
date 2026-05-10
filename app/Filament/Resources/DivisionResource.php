<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DivisionResource\Pages;
use App\Filament\Resources\DivisionResource\RelationManagers;
use App\Models\Division;
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

class DivisionResource extends Resource
{
    protected static ?string $model = Division::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?int $navigationSort = 5;

    protected static ?string $navigationGroup = 'Content Management';

    protected static ?string $label = 'Division Section';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make()
                    ->schema([
                        Grid::make([
                            'default' => 1,
                            'sm' => 2
                        ])->schema([
                            Forms\Components\TextInput::make('title')
                                ->required()
                                ->maxValue(256)
                                ->live(onBlur: true)
                                ->afterStateUpdated(fn(Set $set, ?string $state) => $set('slug', Str::slug($state))),
                            Forms\Components\TextInput::make('slug')
                                ->required()
                                ->maxLength(300)
                                ->readOnly()
                                ->helperText('Slug terisi otomatis setelah mengisi title'),
                        ]),
                        Forms\Components\RichEditor::make('achievements')
                            ->required()
                            ->maxLength(2048)
                            ->disableToolbarButtons([
                                'codeblock',
                                'attachFiles',
                                'link'
                            ]),
                        Forms\Components\RichEditor::make('description')
                            ->required()
                            ->maxLength(2048)
                            ->disableToolbarButtons([
                                'codeblock',
                                'attachFiles',
                                'link'
                            ]),
                        ToggleButtons::make('status')
                            ->inline()
                            ->options([
                                'active' => 'Active',
                                'inactive' => 'Inactive',
                            ]),
                        Forms\Components\FileUpload::make('banner_image')
                            ->image()
                            ->maxSize(2048)
                            ->directory('divisions')
                            ->helperText('Pastikan ukuran gambar adalah lebar 706 px dan panjang 400 px. Unggah maksimal 1 gambar. Hanya file gambar yang diperbolehkan (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB per file.'),
                    ])
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
                Tables\Columns\TextColumn::make('description')
                    ->searchable()
                    ->limit(50),
                Tables\Columns\TextColumn::make('status')
                    ->searchable()
                    ->sortable()
                    ->limit(50)
                    ->formatStateUsing(fn($state) => Str::ucfirst($state)),
                Tables\Columns\ImageColumn::make('banner_image'),
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
            RelationManagers\PlayersRelationManager::class
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDivisions::route('/'),
            'create' => Pages\CreateDivision::route('/create'),
            'view' => Pages\ViewDivision::route('/{record}'),
            'edit' => Pages\EditDivision::route('/{record}/edit'),
        ];
    }
}
