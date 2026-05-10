<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TimelineResource\Pages;
use App\Filament\Resources\TimelineResource\RelationManagers;
use App\Models\Timeline;
use Filament\Forms;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Section;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class TimelineResource extends Resource
{
    protected static ?string $model = Timeline::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?int $navigationSort = 1;

    protected static ?string $navigationGroup = 'Content Management';

    protected static ?string $label = 'Timeline Section';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make()
                    ->schema([
                        Forms\Components\TextInput::make('title')
                            ->required()
                            ->maxValue(256),
                        Forms\Components\RichEditor::make('description')
                            ->required()
                            ->maxLength(2048)
                            ->disableToolbarButtons([
                                'codeblock',
                                'attachFiles',
                                'link'
                            ]),
                    ])->columnSpan(8),
                Section::make()
                    ->schema([
                        Forms\Components\FileUpload::make('images')
                            ->required()
                            ->image()
                            ->directory('timelines')
                            ->multiple()
                            ->minFiles(1)
                            ->maxFiles(4)
                            ->maxSize(2048)
                            ->helperText('Unggah minimal 1 dan maksimal 4 gambar. Hanya file gambar yang diperbolehkan (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB per file.'),
                    ])->columnSpan(4)
            ])->columns(12);
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
                Tables\Columns\ImageColumn::make('images'),
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
            'index' => Pages\ListTimelines::route('/'),
            'create' => Pages\CreateTimeline::route('/create'),
            'view' => Pages\ViewTimeline::route('/{record}'),
            'edit' => Pages\EditTimeline::route('/{record}/edit'),
        ];
    }
}
