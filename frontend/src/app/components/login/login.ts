import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  authService = inject(AuthService);
  pinCode = '';

  login() {
    if (this.pinCode.trim()) {
      this.authService.login(this.pinCode);
    }
  }
}