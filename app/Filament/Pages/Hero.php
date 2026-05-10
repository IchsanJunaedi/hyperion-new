<?php

namespace App\Filament\Pages;

use App\Models\Hero as ModelsHero;
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

class Hero extends Page implements HasForms
{
    use InteractsWithForms;

    public ?array $data = [];

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static string $view = 'filament.pages.hero';

    protected static ?int $navigationSort = 0;

    protected static ?string $navigationGroup = 'Content Management';

    protected static ?string $title = 'Hero Section';

    public function mount()
    {
        $data = DB::table('heroes')
            ->get([
                'logo',
                'title',
                'description',
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
                        FileUpload::make('logo')
                            ->required()
                            ->image()
                            ->directory('logo')
                            ->maxSize(2048)
                            ->helperText('Unggah maksimal 1 gambar. Hanya file gambar yang diperbolehkan (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB per file.'),
                        TextInput::make('title')
                            ->required()
                            ->maxValue(256),
                        Textarea::make('description')
                            ->required()
                            ->autosize()
                            ->maxLength(512),
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

            $modelHero  = ModelsHero::first();
            $modelHero->update([
                'logo' => $data['logo'],
                'title' => $data['title'],
                'description' => $data['description'],
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
