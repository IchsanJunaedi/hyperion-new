<?php

namespace App\Filament\Pages;

use App\Models\About as ModelsAbout;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Support\Exceptions\Halt;
use Illuminate\Support\Facades\DB;

class About extends Page implements HasForms
{
    use InteractsWithForms;

    public ?array $data = [];

    public static string $view = 'filament.pages.about';

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?int $navigationSort = 6;

    protected static ?string $navigationGroup = 'Content Management';

    protected static ?string $navigationLabel = 'About Section';

    public function mount()
    {
        $data = DB::table('abouts')
            ->get([
                'first_description',
                'second_description',
                'parallax_images',
                'banner',
                'vision',
                'mission',
                'values',
            ])->map(function ($item) {
                return (array) $item;
            });

        $this->form->fill($data[0]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make()
                    ->schema([
                        Section::make()
                            ->schema([
                                Textarea::make('first_description')
                                    ->required()
                                    ->autosize()
                                    ->maxLength(4096),
                                Textarea::make('second_description')
                                    ->required()
                                    ->autosize()
                                    ->maxLength(4096),
                                Textarea::make('vision')
                                    ->required()
                                    ->autosize()
                                    ->maxLength(2048),
                                Textarea::make('mission')
                                    ->required()
                                    ->autosize()
                                    ->maxLength(2048),
                                Textarea::make('values')
                                    ->required()
                                    ->autosize()
                                    ->maxLength(2048),
                            ]),
                        Section::make()
                            ->schema([
                                FileUpload::make('banner')
                                    ->required()
                                    ->image()
                                    ->directory('banner')
                                    ->maxSize(2048)
                                    ->helperText('Unggah maksimal 1 gambar. Hanya file gambar yang diperbolehkan (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB per file.'),
                                FileUpload::make('parallax_images')
                                    ->required()
                                    ->image()
                                    ->minFiles(1)
                                    ->multiple()
                                    ->maxFiles(4)
                                    ->directory('parallax_images')
                                    ->maxSize(2048)
                                    ->helperText('Unggah minimal 4 gambar. Hanya file gambar yang diperbolehkan (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB per file.'),
                            ])
                    ])
            ])->statePath('data');
    }

    protected function getFormActions(): array
    {
        return [
            Action::make('save')
                ->label(__('filament-panels::resources/pages/edit-record.form.actions.save.label'))
                ->submit('save'),
        ];
    }

    public function save(): void
    {
        try {
            $data = $this->form->getState();

            $modelHero  = ModelsAbout::first();
            $modelHero->update([
                'first_description' => $data['first_description'],
                'second_description' => $data['second_description'],
                'parallax_images' => $data['parallax_images'],
                'vision' => $data['vision'],
                'mission' => $data['mission'],
                'values' => $data['values'],
                'banner' => $data['banner'],
            ]);
        } catch (Halt $exception) {
            return;
        }

        Notification::make()
            ->success()
            ->title(__('filament-panels::resources/pages/edit-record.notifications.saved.title'))
            ->send();
    }
}
