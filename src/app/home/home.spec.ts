import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the main marketing features', () => {
    expect(component.features.length).toBe(6);
    const featureIds = component.features.map(f => f.id);
    expect(featureIds).toContain('pos');
    expect(featureIds).toContain('inventory');
    expect(featureIds).toContain('cashin-out-fees');
    expect(featureIds).toContain('wallets');
    expect(featureIds).toContain('invoices');
    expect(featureIds).toContain('reports');
  });
});
