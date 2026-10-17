import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoiceComponent } from './invoice';

describe('InvoiceComponent', () => {
  let component: InvoiceComponent;
  let fixture: ComponentFixture<InvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
