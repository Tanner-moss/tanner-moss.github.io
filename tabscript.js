function scrollToTab(index) {
    const scrollContainer = document.querySelector('.scroll-container');
    const contentWidth = scrollContainer.clientWidth;
    const scrollPosition = contentWidth * index;

    const contents = document.querySelectorAll('.content');
    contents.forEach((content, i) => {
        if (i === index) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    const slider = document.querySelector('.slider');
    slider.style.transform = `translateX(${index * 100}%)`;

    scrollContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });
}
