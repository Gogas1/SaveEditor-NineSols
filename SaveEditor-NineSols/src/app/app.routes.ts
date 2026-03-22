import { Routes } from '@angular/router';
import { SaveFileTab } from './filework/components/save-file-tab/save-file-tab';
import { SaveSlotInfoTab } from './saveslot/components/save-slot-info-tab/save-slot-info-tab';
import { EditorTab } from './editor/components/editor-tab/editor-tab';
import { ProfileTab } from './profile/components/profile-tab/profile-tab';

export const routes: Routes = [
    {
        path: "",
        component: SaveFileTab
    },
    {
        path: "file",
        component: SaveFileTab
    },
    {
        path: "saveslot",
        component: SaveSlotInfoTab
    },
    {
        path: "editor",
        component: EditorTab,
        data: { reuse: true }
    },
    {
        path: "profiles",
        component: ProfileTab
    }
];
