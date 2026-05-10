<?php

namespace App\Filament\Resources\JoinResource\Pages;

use App\Filament\Resources\JoinResource;
use Filament\Actions;
use Filament\Resources\Pages\ManageRecords;

class ManageJoins extends ManageRecords
{
    protected static string $resource = JoinResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
