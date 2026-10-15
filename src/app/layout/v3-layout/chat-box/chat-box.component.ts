import { Component, AfterViewInit, Renderer2, OnDestroy, inject } from '@angular/core';

@Component({
  selector: 'app-chat-box',
  template: '',
  standalone: true
})
export class ChatBoxComponent implements AfterViewInit, OnDestroy {
  private renderer = inject(Renderer2);

  private checkInterval: ReturnType<typeof setInterval>;
  private timeout: number = 30 * 1000; // 30 Sec
  private intervalTime: number = 100; // Check every 100ms

  ngAfterViewInit(): void {
    this.waitForChatBox();    
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  waitForChatBox(): void {
    const startTime = Date.now();

    this.checkInterval = setInterval(() => {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) {
        clearInterval(this.checkInterval);
        this.openChatBox(chatBox);
      } else if (Date.now() - startTime > this.timeout) {
        clearInterval(this.checkInterval);
      }
    }, this.intervalTime);
  }

  openChatBox(chatBox: HTMLElement): void {
    // Set initial position and style
    this.renderer.setStyle(chatBox, 'display', 'block');
    this.renderer.setStyle(chatBox, 'position', 'fixed');
    this.renderer.setStyle(chatBox, 'bottom', '10px');
    this.renderer.setStyle(chatBox, 'right', '10px');
    this.renderer.setStyle(chatBox, 'z-index', '9999');

    // Make the chat box draggable
    this.makeDraggable(chatBox);
  }

  makeDraggable(element: HTMLElement): void {
    let offsetX: number;
    let offsetY: number;
  
    const onMove = (clientX: number, clientY: number) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementRect = element.getBoundingClientRect();
      
      let newRight = viewportWidth - (clientX + elementRect.width - offsetX);
      let newBottom = viewportHeight - (clientY + elementRect.height - offsetY);
  
      // Ensure newRight doesn't go beyond viewport boundaries (left and right)
      if (newRight < 0) {
        newRight = 0;
      } else if (newRight + elementRect.width > viewportWidth) {
        newRight = viewportWidth - elementRect.width;
      }
  
      // Ensure newBottom doesn't go beyond viewport boundaries (top and bottom)
      if (newBottom < 0) {
        newBottom = 0;
      } else if (newBottom + elementRect.height > viewportHeight) {
        newBottom = viewportHeight - elementRect.height;
      }
  
      // Apply the new position using right and bottom
      this.renderer.setStyle(element, 'right', `${newRight}px`);
      this.renderer.setStyle(element, 'bottom', `${newBottom}px`);
    };
  
    const onMouseMove = (event: MouseEvent) => {
      onMove(event.clientX, event.clientY);
    };
  
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      onMove(touch.clientX, touch.clientY);
    };
  
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  
    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  
    const onStart = (clientX: number, clientY: number) => {
      const elementRect = element.getBoundingClientRect();
      offsetX = clientX - elementRect.left;
      offsetY = clientY - elementRect.top;
    };
  
    const onMouseDown = (event: MouseEvent) => {
      onStart(event.clientX, event.clientY);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
  
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      onStart(touch.clientX, touch.clientY);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    };
  
    this.renderer.listen(element, 'mousedown', onMouseDown);
    this.renderer.listen(element, 'touchstart', onTouchStart);
  }
}
