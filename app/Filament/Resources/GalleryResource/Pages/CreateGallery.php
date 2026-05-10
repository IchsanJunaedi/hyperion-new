<?php

namespace App\Filament\Resources\GalleryResource\Pages;

use App\Filament\Resources\GalleryResource;
use App\Models\Division;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\DB;
use Symfony\Component\DomCrawler\Crawler;

class CreateGallery extends CreateRecord
{
    protected static string $resource = GalleryResource::class;

    // protected function mutateFormDataBeforeCreate(array $data): array
    // {
    //     DB::transaction(function () use ($data) {
    //         $division = Division::query()->findOrFail($data['division_id'], ['id', 'achievements']);

    //         $existingAchievements = [];
    //         if (!empty($division->achievements)) {
    //             $crawler = new Crawler($division->achievements);
    //             $existingAchievements = $crawler->filter("li")->each(fn(Crawler $node, $i) => $node->text());
    //         }

    //         $allAchievements = [...$existingAchievements, $data['title']];

    //         $listItems = array_map(
    //             fn($item) => "<li>" . htmlspecialchars($item) . "</li>",
    //             $allAchievements
    //         );

    //         $division->update([
    //             'achievements' => '<ol>' . implode('', $listItems) . '</ol>'
    //         ]);
    //     });

    //     return $data;
    // }
}
