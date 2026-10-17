import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MsalService } from '@azure/msal-angular';
import { App } from './app';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: MsalService,
          useValue: {
            handleRedirectObservable: () => of(null)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should open password modal on hamburger click when locked', () => {
    expect(component.isUnlocked()).toBe(false);
    expect(component.isPasswordModalOpen()).toBe(false);

    component.onHamburgerClick();

    expect(component.isPasswordModalOpen()).toBe(true);
    expect(component.isSidebarOpen()).toBe(false);
  });

  it('should show error on incorrect password', () => {
    component.onHamburgerClick();
    component.passwordInput.set('wrongpass');
    component.submitPassword();

    expect(component.isUnlocked()).toBe(false);
    expect(component.isSidebarOpen()).toBe(false);
    expect(component.passwordError()).toBe('Incorrect password. Please try again.');
  });

  it('should unlock and open sidebar with correct password mc0928', () => {
    component.onHamburgerClick();
    component.passwordInput.set('mc0928');
    component.submitPassword();

    expect(component.isUnlocked()).toBe(true);
    expect(component.isPasswordModalOpen()).toBe(false);
    expect(component.isSidebarOpen()).toBe(true);
    expect(component.passwordError()).toBe('');
  });

  it('should toggle sidebar directly when already unlocked', () => {
    component.isUnlocked.set(true);
    component.isSidebarOpen.set(false);

    component.onHamburgerClick();
    expect(component.isSidebarOpen()).toBe(true);

    component.onHamburgerClick();
    expect(component.isSidebarOpen()).toBe(false);
  });

  it('should lock menu and close sidebar when lockMenu is called', () => {
    component.isUnlocked.set(true);
    component.isSidebarOpen.set(true);

    component.lockMenu();
    expect(component.isUnlocked()).toBe(false);
    expect(component.isSidebarOpen()).toBe(false);
  });
});
