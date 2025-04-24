import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { MarkdownEditorComponent } from './components/markdown-editor/markdown-editor.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'admin', component: AdminPanelComponent },
  { path: 'editor', component: MarkdownEditorComponent }
];
