/*-----------------------------------------------------------------------------------

    Theme Name: Mivon
    Theme URI: http://
    Description: Creative Agency & Portfolio
    Author: UI-ThemeZ
    Author URI: http://themeforest.net/user/UI-ThemeZ
    Version: 1.0

-----------------------------------------------------------------------------------*/


$(function () {

    "use strict";

    $(document).ready(function () {

        ShowcaseSnapSlider();
    });


    var wind = $(window);


    /* =============================================================================
    -----------------------------  Smooth Scroll nav   -----------------------------
    ============================================================================= */


    $.scrollIt({
        upKey: 38,                // key code to navigate to the next section
        downKey: 40,              // key code to navigate to the previous section
        easing: 'linear',          // the easing function for animation
        scrollTime: 600,          // how long (in ms) the animation takes
        activeClass: 'active',    // class given to the active nav element
        onPageChange: null,       // function(pageIndex) that is called when page is changed
        topOffset: -75            // offste (in px) for fixed top navigation
    });


    /* =============================================================================
    -----------------------------  Dark & Light Mode   -----------------------------
    ============================================================================= */

    $(function () {

        function isLight() {
            return localStorage.getItem("light-mode");
        }

        function toggleRootClass() {
            document.querySelector("body:not(.notmode)").classList.toggle("light");
        }

        function toggleLocalStorageItem() {
            if (isLight()) {
                localStorage.removeItem("light-mode");
                $(".navbar .logo img , footer .logo img").attr("src", "assets/imgs/logo-light.svg");
            } else {
                localStorage.setItem("light-mode", "set");
                $(".navbar .logo img , footer .logo img").attr("src", "assets/imgs/logo-dark.svg");
            }
        }

        if (isLight()) {
            toggleRootClass();
        }

        document.querySelector(".theme-icon").addEventListener("click", () => {
            toggleLocalStorageItem();
            toggleRootClass();
        });

        $("body.light .navbar .logo img , body.light footer .logo img").attr("src", "assets/imgs/logo-dark.svg");

    });


    /* =============================================================================
    --------------------------------  Navbar Menu   --------------------------------
    ============================================================================= */

    $('.navbar .dropdown').hover(function () {
        $(this).find('.dropdown-menu').addClass('show');
    }, function () {
        $(this).find('.dropdown-menu').removeClass('show')
    });

    $('.navbar .dropdown-item').hover(function () {
        $(this).find('.dropdown-side').addClass('show');
    }, function () {
        $(this).find('.dropdown-side').removeClass('show')
    });

    $(".navbar .search-form").on("click", ".search-icon", function () {

        $(".navbar .search-form").toggleClass("open");

        if ($(".navbar .search-form").hasClass('open')) {

            $(".search-form .close-search").slideDown();

        } else {

            $(".search-form .close-search").slideUp();
        }
    });

    $(".navbar").on("click", ".navbar-toggler", function () {

        $(".navbar .navbar-collapse").toggleClass("show");
    });

    wind.on("scroll", function () {

        var bodyScroll = wind.scrollTop(),
            navbar = $(".navbar"),
            logo = $(".navbar.change .logo> img");

        if (bodyScroll > 300) {

            navbar.addClass("nav-scroll");
            logo.attr('src', 'assets/imgs/logo-dark.png');

        } else {

            navbar.removeClass("nav-scroll");
            logo.attr('src', 'assets/imgs/logo-light.png');
        }
    });

    function noScroll() {
        window.scrollTo(0, 0);
    }

    $('.navbar .menu-icon').on('click', function () {

        $('.hamenu').addClass("open");
        $('.hamenu').animate({ top: 0 });

        $('.blur-menubg').addClass("active");

    });

    $('.hamenu .close-menu, .one-scroll .menu-links .main-menu > li').on('click', function () {

        $('.hamenu').removeClass("open").delay(100).animate({ top: "-100%" });
        $('.hamenu .menu-links .main-menu .dmenu, .hamenu .menu-links .main-menu .sub-dmenu').removeClass("dopen");
        $('.hamenu .menu-links .main-menu .sub-menu, .hamenu .menu-links .main-menu .sub-menu2').slideUp();

        $('.blur-menubg').removeClass("active");

    });

    $('.hamenu .menu-links .main-menu > li').on('mouseenter', function () {
        $(this).removeClass('hoverd').siblings().addClass('hoverd');
    });

    $('.hamenu .menu-links .main-menu > li').on('mouseleave', function () {
        $(this).removeClass('hoverd').siblings().removeClass('hoverd');
    });


    $('.main-menu > li .dmenu').on('click', function () {
        $(this).parent().parent().find(".sub-menu").toggleClass("sub-open").slideToggle();
        $(this).toggleClass("dopen");
    });

    $('.sub-menu > ul > li .sub-dmenu').on('click', function () {
        $(this).parent().parent().find(".sub-menu2").toggleClass("sub-open").slideToggle();
        $(this).toggleClass("dopen");
    });


    /* =============================================================================
    ------------------------------  Snap parallax gsap   ------------------------------
    ============================================================================= */

    function ShowcaseSnapSlider() {
        const $holder = $(".ui-snap-slider");
        if (!$holder.length) return;

        const holder = document.querySelector(".ui-snap-slider"),
            slides = gsap.utils.toArray(".snap-slide"),
            thumbsWrapper = document.querySelector(".snap-slider-thumbs"),
            snapCaptionWrapper = document.querySelector(".snap-slider-captions"),
            snapCaptions = gsap.utils.toArray(".snap-slide-caption"),
            thumbs = gsap.utils.toArray(".thumb-slide"),
            thumbsImg = gsap.utils.toArray(".thumb-slide img"),
            vh = window.innerHeight;

        ScrollTrigger.create({
            trigger: slides, start: "top top", end: "+=" + vh * (slides.length - 1),
            pin: thumbsWrapper, scrub: true
        });

        gsap.fromTo(thumbs, { y: 0 }, {
            y: -thumbs[0].offsetHeight * (thumbs.length - 1),
            scrollTrigger: { trigger: holder, start: "top top", end: "+=" + vh * (slides.length - 1), scrub: true },
            ease: "none"
        });

        // Pin and animate captions
        ScrollTrigger.create({
            trigger: snapCaptionWrapper,
            start: "top top",
            end: () => "+=" + innerHeight * (slides.length - 1),
            pin: true,
            scrub: true,
        });

        gsap.fromTo(
            snapCaptions,
            { y: 0 },
            {
                y: -snapCaptions[0].offsetHeight * (snapCaptions.length - 1),
                scrollTrigger: {
                    trigger: holder,
                    scrub: true,
                    start: "top top",
                    end: "+=" + innerHeight * (slides.length - 1),
                },
                ease: "none",
            }
        );

        gsap.set(slides, { height: vh });

        ScrollTrigger.create({
            trigger: slides, start: "top top", end: "+=" + vh * (slides.length - 1),
            snap: { snapTo: gsap.utils.snap(1 / (slides.length - 1)), duration: { min: 0.2, max: 0.7 }, ease: "power4.inOut" }
        });

        slides.forEach((slide, i) => {
            const imgMasks = slide.querySelectorAll(".main-img"),
                isLast = i === slides.length - 1,
                isFirst = i === 0;

            gsap.fromTo(imgMasks, { y: isFirst ? 0 : -vh }, {
                y: isLast ? 0 : vh,
                scrollTrigger: { trigger: slide, scrub: true, start: isFirst ? "top top" : "top bottom", end: isLast ? "top top" : undefined },
                ease: "none"
            });

            if (thumbsImg[i]) {
                const half = thumbsImg[i].offsetHeight / 2;
                gsap.fromTo(thumbsImg[i], { y: isFirst ? 0 : -half }, {
                    y: isLast ? 0 : half,
                    scrollTrigger: { trigger: slide, scrub: true, start: isFirst ? "top top" : "top bottom", end: isLast ? "top top" : undefined },
                    ease: "none"
                });
            }
        });
    }

    /* =============================================================================
    ------------------------------  Parallax Swiper   ------------------------------
    ============================================================================= */


    var parallaxShowCase;
    var parallaxShowCaseOptions = {
        speed: 1500,
        autoplay: {
            delay: 5000,
        },
        parallax: true,
        mousewheel: true,
        loop: true,

        on: {
            init: function () {
                var swiper = this;
                for (var i = 0; i < swiper.slides.length; i++) {
                    $(swiper.slides[i])
                        .find('.bg-img')
                        .attr({
                            'data-swiper-parallax': 0.75 * swiper.width
                        });
                }
            },
            resize: function () {
                this.update();
            }
        },

        pagination: {
            el: '.showcase-full .swiper-pagination',
            clickable: true
        },

        navigation: {
            nextEl: '.showcase-full .swiper-button-next',
            prevEl: '.showcase-full .swiper-button-prev'
        }
    };
    parallaxShowCase = new Swiper('.showcase-full .parallax-slider-full', parallaxShowCaseOptions);


    /* =============================================================================
    ------------------------------  Swiper slider   -----------------------------
    ============================================================================= */

    var testim2 = new Swiper(".testim-style2 .swiper-container", {
        slidesPerView: 1,
        spaceBetween: 10,
        speed: 1500,
        autoplay: {
            delay: 5000,
        },
        loop: true,
        pagination: {
            el: ".testim-style2 .swiper-pagination",
            clickable: true,
        },
    });

    var testimCard = new Swiper(".testim-card2 .testim-swiper", {
        effect: "cards",
        grabCursor: true,
        navigation: {
            nextEl: '.testim-card2 .swiper-button-next',
            prevEl: '.testim-card2 .swiper-button-prev',
        },
        keyboard: {
            enabled: true,
            onlyInViewport: false,
        }
    });

    var testim3 = new Swiper(".testim-style3 .swiper-container", {
        slidesPerView: 3,
        spaceBetween: 30,
        speed: 1500,
        autoplay: {
            delay: 5000,
        },
        loop: true,
        pagination: {
            el: ".testim-style3 .swiper-pagination",
            clickable: true,
        },

        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            640: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            },
        },
    });

    var Blog1 = new Swiper('.blog-style1 .swiper-container , .blog-style2 .swiper-container', {
        slidesPerView: 3,
        spaceBetween: 30,
        speed: 1500,
        pagination: {
            el: ".blog-style1 .swiper-pagination",
            type: "fraction",
        },
        navigation: {
            nextEl: '.blog-style1 .swiper-button-next',
            prevEl: '.blog-style1 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: false,
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            640: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            },
        },
    });

    var heroaward = new Swiper(".hero-style2 .awards-swiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        speed: 1500,
        autoplay: {
            delay: 5000,
        },
        loop: true,
        pagination: {
            el: ".hero-style2 .swiper-pagination",
            clickable: true,
        },

        navigation: {
            nextEl: ".hero-style2 .swiper-button-next",
            prevEl: ".hero-style2 .swiper-button-prev",
        },
    });

    var team = new Swiper(".about-md .team-swiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        speed: 1500,
        loop: true,
        pagination: {
            el: ".about-md .swiper-pagination",
            clickable: true,
        },

        navigation: {
            nextEl: ".about-md .swiper-button-next",
            prevEl: ".about-md .swiper-button-prev",
        },
    });

    // thumb slider
    var portfolioThumbSlider = new Swiper('.testim-style1 .thumb-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        // centeredSlides: true,
        speed: 2000,
        // watchSlidesProgress: true,
        navigation: {
            nextEl: '.testim-style1 .swiper-button-next',
            prevEl: '.testim-style1 .swiper-button-prev',
        },
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
        },
        mousewheel: false,
        keyboard: true,
        loop: true,
        allowTouchMove: false,
        a11y: false,
    });

    // main slider
    var portfolioMainSlider = new Swiper('.testim-style1 .main-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        centeredSlides: true,
        speed: 2000,
        pagination: {
            el: '.testim-style1 .swiper-pagination',
            type: 'fraction',
        },
        navigation: {
            nextEl: '.testim-style1 .swiper-button-next',
            prevEl: '.testim-style1 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
        },
        loop: true,
        // thumbs: {
        //     swiper: portfolioThumbSlider
        // },
        allowTouchMove: false,
        a11y: false,
    });


    var heroeffect = new Swiper(".hero-swiper", {
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: "auto",
        spaceBetween: 10,
        loop: true,
        loopedSlides: 8,
        coverflowEffect: {
            rotate: 80,
            depth: -100,
            modifier: .2,
            scale: 1.2,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    });

    var swiperVer = new Swiper('.portfolio-vertical .swiper-container', {
        direction: 'vertical',
        slidesPerView: 7,
        centeredSlides: true,
        spaceBetween: 0,
        mousewheel: true,
        grabCursor: true,
        loop: true,
        speed: 1500,
        autoplay: {
            delay: 1500,
            disableOnInteraction: false,
        },
    });


    /* =============================================================================
    ------------------------------  Interactive work   -----------------------------
    ============================================================================= */

    $('.inter-links-center .links-text li').on('mouseenter', function () {
        var tab_id = $(this).attr('data-tab');
        $('.links-text li').removeClass('current');
        $(this).addClass('current');

        $('.links-img .img').removeClass('current');
        $("#" + tab_id).addClass('current');

        if ($(this).hasClass('current')) {
            return false;
        }
    });


    $('.inter-links-center .links-text li').on('mouseenter', function () {
        $(this).removeClass('no-active').siblings().addClass('no-active');
    });

    $('.inter-links-center .links-text li').on('mouseleave', function () {
        $('.inter-links-center .links-text li').removeClass('no-active');
    });


    /* =============================================================================
    ------------------------------  Interactive   -----------------------------
    ============================================================================= */

    $('.interactive-sec .cluom').on('mouseenter', function () {
        var tab_id = $(this).attr('data-tab');
        $('.interactive-sec .cluom').removeClass('current');
        $(this).addClass('current');

        $('.interactive-sec .glry-img .tab-img ').removeClass('current');
        $("#" + tab_id).addClass('current');

        if ($(this).hasClass('current')) {
            return false;
        }
    });



    // 25. hover reveal for image //
    const hoverItem = document.querySelectorAll(".hover-reveal-item");
    function moveImage(e, hoverItem) {
        const item = hoverItem.getBoundingClientRect();
        const x = e.clientX - item.x;
        const y = e.clientY - item.y;
        if (hoverItem.children[1]) {
            hoverItem.children[1].style.transform = `translate(${x}px, ${y}px)`;
        }
    }
    hoverItem.forEach((item, i) => {
        item.addEventListener("mousemove", (e) => {
            setInterval(moveImage(e, item), 100);
        });
    });


    if (window.innerWidth > 991) {
        const ls = gsap.timeline({
            scrollTrigger: {
                trigger: ".main-container .left-side",
                start: "top",
                endTrigger: ".main-container",
                end: "bottom bottom",
                pin: true,
                pinSpacing: false
            }
        });
    }



    $('.team-reval .item-row , .awards-reval .item-row , .serv-style6 .item').hover(function () {
        $(".team-reval .item-row , .awards-reval .item-row , .serv-style6 .item").css("opacity", ".2");
        $(this).css("opacity", "1");
    }, function () {
        $(".team-reval .item-row , .awards-reval .item-row , .serv-style6 .item").css("opacity", "1");
    });



    /* =============================================================================
   ------------------------------  Cards   ------------------------------
   ============================================================================= */


    $(function () {
        var width = $(window).width();
        if (width > 991) {

            "use strict";

            const fe = gsap.timeline({
                scrollTrigger: {
                    trigger: ".features .stack-title",
                    start: "center center",
                    endTrigger: ".features",
                    end: "bottom bottom",
                    pin: true,
                    pinSpacing: false,
                }

            });


            const ts = gsap.timeline({
                scrollTrigger: {
                    trigger: ".testim-cards .stack-title",
                    start: "center center",
                    endTrigger: ".testim-cards",
                    end: "bottom bottom",
                    pin: true,
                    pinSpacing: false
                }
            });

            let cards = gsap.utils.toArray(".stackCard");

            if (!cards.length) {
                return;
            }

            let stickDistance = 0;

            let firstCardST = ScrollTrigger.create({
                trigger: cards[0],
                start: "center center"
            });

            let lastCardST = ScrollTrigger.create({
                trigger: cards[cards.length - 1],
                start: "center center"
            });

            cards.forEach((card, index) => {

                var scale = 1 - (cards.length - index) * 0.025;
                let scaleDown = gsap.to(card, { scale: scale, 'transform-origin': '"50% ' + (lastCardST.start + stickDistance) + '"' });

                ScrollTrigger.create({
                    trigger: card,
                    start: "center center",
                    end: () => lastCardST.start + stickDistance,
                    pin: true,
                    pinSpacing: false,
                    ease: "none",
                    animation: scaleDown,
                    toggleActions: "restart none none reverse"
                });
            });

        }
    });


    /* =============================================================================
   ------------------------------  Animation   ------------------------------
   ============================================================================= */

    const initRevealElements = () => {
        const elements = document.querySelectorAll("[data-ui-animate]");
        const Springer = window.Springer.default;
        elements.forEach((elem) => {
            const duration = elem.getAttribute("data-duration") ? parseFloat(elem.getAttribute("data-duration")) : 0.6;
            const delay = elem.getAttribute("data-delay") ? parseFloat(elem.getAttribute("data-delay")) : 0;
            const offset = elem.getAttribute("data-offset") ? parseFloat(elem.getAttribute("data-offset")) : 60;
            const instant = elem.hasAttribute("data-instant") && elem.getAttribute("data-instant") !== "false";
            const start = elem.getAttribute("data-start") || "top 90%";
            const end = elem.getAttribute("data-end") || "top 50%";
            const direction = elem.getAttribute("data-direction") || "down";
            const useSpring = elem.hasAttribute("data-spring");
            const spring = useSpring ? Springer(0.2, 0.8) : null;
            const rotation = elem.getAttribute("data-rotation") ? parseFloat(elem.getAttribute("data-rotation")) : 0;
            const animationType = elem.getAttribute("data-animation-type") || "from";
            elem.style.opacity = "1";
            elem.style.filter = "blur(0)";
            let animationProps;
            if (animationType === "to") {
                animationProps = {
                    opacity: 1,
                    filter: "blur(0)",
                    duration,
                    delay,
                    ease: useSpring ? spring : "power2.out"
                };
                if (rotation !== 0) {
                    animationProps.rotation = rotation;
                }
            } else {
                animationProps = {
                    opacity: 0,
                    filter: "blur(16px)",
                    duration,
                    delay,
                    ease: useSpring ? spring : "power2.out"
                };
                if (rotation !== 0) {
                    animationProps.rotation = rotation;
                }
            }
            if (!instant) {
                animationProps.scrollTrigger = {
                    trigger: elem,
                    start,
                    end,
                    scrub: false
                };
            }
            switch (direction) {
                case "left":
                    animationProps.x = -offset;
                    break;
                case "right":
                    animationProps.x = offset;
                    break;
                case "down":
                    animationProps.y = offset;
                    break;
                case "up":
                default:
                    animationProps.y = -offset;
                    break;
            }
            if (animationType === "to") {
                gsap.to(elem, animationProps);
            } else {
                gsap.from(elem, animationProps);
            }
        });
    };

    window.addEventListener("load", () => {
        initRevealElements();
    });

    /* =============================================================================
   ------------------------------  Data Background   ------------------------------
   ============================================================================= */

    var pageSection = $(".bg-img, section");
    pageSection.each(function (indx) {

        if ($(this).attr("data-background")) {
            $(this).css("background-image", "url(" + $(this).data("background") + ")");
        }
    });

    var pageSectionColor = $(".bg-solid-color, section");
    pageSectionColor.each(function (indx) {

        var color = $(this).attr("data-solid-color");

        if ($(this).attr("data-solid-color")) {
            $(this).css("background-color", color);
        }
    });

    /* =============================================================================
   ------------------------------  Fixed head   ------------------------------
   ============================================================================= */

    let a = gsap.timeline({
        scrollTrigger: {
            trigger: ".fix-title-sec",
            start: "top center",
            end: "bottom bottom",
            scrub: true,
            pin: ".fix-title-sec .sec-head-crev",
        },
    })

        .to(".fix-title-sec .sec-head-crev", {
            scale: 1.3,
            opacity: 0,
            ease: 'Linear.easeNone'
        });

    /* =============================================================================
    -----------------------------------  Tabs  -------------------------------------
    ============================================================================= */

    $('#tabs .tab-links').on('click', '.item-link', function () {

        var tab_id = $(this).attr('data-tab');

        $('#tabs .tab-links .item-link').removeClass('current');
        $(this).addClass('current');

        $('.tab-content').hide();
        $("#" + tab_id).show();

    });

    $('#tabs-fade .tab-links').on('click', '.item-link', function () {

        var tab2_id = $(this).attr('data-tab');

        $('#tabs-fade .tab-links .item-link').removeClass('current');
        $(this).addClass('current');

        $('.tab-content').fadeOut();
        $("#" + tab2_id).fadeIn();

    });

    /* ===============================  Accordion Side  =============================== */

    $(".portfolio-crev .item, .portfolio-elegant .item").hover(
        function () {
            $(".portfolio-elegant .item .cont").addClass("hide");
            $(this).addClass("active");
        },
        function () {
            $(this).removeClass("active");
            $(".portfolio-elegant .item .cont").removeClass("hide");
        }
    );


    /* =============================================================================
    --------------------------------  Accordion  -----------------------------------
    ============================================================================= */

    $(".accordion").on("click", ".title", function () {

        $(this).next().slideDown();

        $(".accordion-info").not($(this).next()).slideUp();

    });

    $(".accordion").on("click", ".accordion-item", function () {

        $(".accordion .accordion-item").removeClass("active");
        $(this).addClass("active");

    });


    /* =============================================================================
    ---------------------------------  Tolltip  ------------------------------------
    ============================================================================= */

    $('[data-tooltip-tit]').hover(function () {
        $('<div class="div-tooltip-tit"></div>').text($(this).attr('data-tooltip-tit')).appendTo('body').fadeIn();
    }, function () {
        $('.div-tooltip-tit').remove();
    }).mousemove(function (e) {
        $('.div-tooltip-tit').css({ top: e.pageY + 10, left: e.pageX + 20 })
    });

    $('[data-tooltip-sub]').hover(function () {
        $('<div class="div-tooltip-sub"></div>').text($(this).attr('data-tooltip-sub')).appendTo('body').fadeIn();
    }, function () {
        $('.div-tooltip-sub').remove();
    }).mousemove(function (e) {
        $('.div-tooltip-sub').css({ top: e.pageY + (-20), left: e.pageX + 30 })
    });


    /* =============================================================================
    -------------------------------  Progress Bar  ---------------------------------
    ============================================================================= */

    wind.on('scroll', function () {
        $(".skill-progress .progres").each(function () {
            var bottom_of_object =
                $(this).offset().top + $(this).outerHeight();
            var bottom_of_window =
                $(window).scrollTop() + $(window).height();
            var myVal = $(this).attr('data-value');
            if (bottom_of_window > bottom_of_object) {
                $(this).css({
                    width: myVal
                });
            }
        });
    });


    var $targetElements = $('.same-hw');

    // Function to set height equal to width
    function setHeightEqualToWidth() {
        $targetElements.each(function () {
            var elementWidth = $(this).width();
            $(this).height(elementWidth);
        });
    }

    // Call the function on page load
    setHeightEqualToWidth();

    // Call the function on window resize to maintain the aspect ratio
    $(window).resize(function () {
        setHeightEqualToWidth();
    });

    /* =============================================================================
    -----------------------------  Trigger Plugins  --------------------------------
    ============================================================================= */

    /* ========== YouTubePopUp ========== */

    $("a.vid").YouTubePopUp();


    /* ========== magnificPopup ========== */

    $('.popup-img , .gallery').magnificPopup({
        delegate: '.popimg',
        type: 'image',
        gallery: {
            enabled: true
        }
    });


    /* =========== hover3d =========== */

    $(".hover3d").hover3d({
        selector: ".hover3d-child",
        invert: true
    });

});


/* =============================================================================
-----------------------------  cursor Animation  -----------------------------
============================================================================= */

(function () {
    const link = document.querySelectorAll('.hover-this');
    const cursor = document.querySelector('.cursor');
    const animateit = function (e) {
        const hoverAnim = this.querySelector('.hover-anim');
        const { offsetX: x, offsetY: y } = e,
            { offsetWidth: width, offsetHeight: height } = this,
            move = 25,
            xMove = x / width * (move * 2) - move,
            yMove = y / height * (move * 2) - move;
        hoverAnim.style.transform = `translate(${xMove}px, ${yMove}px)`;
        if (e.type === 'mouseleave') hoverAnim.style.transform = '';
    };
    const editCursor = e => {
        const { clientX: x, clientY: y } = e;
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
    };
    link.forEach(b => b.addEventListener('mousemove', animateit));
    link.forEach(b => b.addEventListener('mouseleave', animateit));
    window.addEventListener('mousemove', editCursor);

    $("a, .cursor-pointer").hover(
        function () {
            $(".cursor").addClass("cursor-active");
        }, function () {
            $(".cursor").removeClass("cursor-active");
        }
    );


    /* =============================================================================
    -----------------------------  Text Animation  -----------------------------
    ============================================================================= */


    let elements = document.querySelectorAll(".rolling-text");

    elements.forEach((element) => {
        let innerText = element.innerText;
        element.innerHTML = "";

        let textContainer = document.createElement("div");
        textContainer.classList.add("block");

        for (let letter of innerText) {
            let span = document.createElement("span");
            span.innerText = letter.trim() === "" ? "\xa0" : letter;
            span.classList.add("letter");
            textContainer.appendChild(span);
        }

        element.appendChild(textContainer);
        element.appendChild(textContainer.cloneNode(true));
    });

    elements.forEach((element) => {
        element.addEventListener("mouseover", () => {
            element.classList.remove("play");
        });
    });
})();


/* =============================================================================
////////////////////////////////////////////////////////////////////////////////
============================================================================= */

$(window).on("load", function () {


    /* =============================================================================
    ---------------------------------  Preloader  ----------------------------------
    ============================================================================= */

    var body = $('body');
    body.addClass('loaded');
    setTimeout(function () {
        body.removeClass('loaded');
    }, 1500);


    /* =============================================================================
    -----------------------------  isotope Masonery   ------------------------------
    ============================================================================= */

    $('.gallery').isotope({
        itemSelector: '.items'
    });

    // isotope
    $('.gallery2').isotope({
        // options
        itemSelector: '.items',
        masonry: {
            // use element for option
            columnWidth: '.width2'
        }
    });

    var $gallery = $('.gallery , .gallery2').isotope();

    $('.filtering').on('click', 'span', function () {
        var filterValue = $(this).attr('data-filter');
        $gallery.isotope({ filter: filterValue });
    });

    $('.filtering').on('click', 'span', function () {
        $(this).addClass('active').siblings().removeClass('active');
    });


    /* =============================================================================
    -----------------------------  Contact Valdition   -----------------------------
    ============================================================================= */

    $('#contact-form').validator();

    $('#contact-form').on('submit', function (e) {
        if (!e.isDefaultPrevented()) {
            var url = "contact.php";

            $.ajax({
                type: "POST",
                url: url,
                data: $(this).serialize(),
                success: function (data) {
                    var messageAlert = 'alert-' + data.type;
                    var messageText = data.message;

                    var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + messageText + '</div>';
                    if (messageAlert && messageText) {
                        $('#contact-form').find('.messages').html(alertBox);
                        $('#contact-form')[0].reset();
                    }
                }
            });
            return false;
        }
    });

});


/* =============================================================================
-----------------------------  Button scroll up   ------------------------------
============================================================================= */

$(document).ready(function () {

    "use strict";

    var progressPath = document.querySelector('.progress-wrap path');
    var pathLength = progressPath.getTotalLength();
    progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
    progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';
    var updateProgress = function () {
        var scroll = $(window).scrollTop();
        var height = $(document).height() - $(window).height();
        var progress = pathLength - (scroll * pathLength / height);
        progressPath.style.strokeDashoffset = progress;
    }
    updateProgress();
    $(window).scroll(updateProgress);
    var offset = 150;
    var duration = 550;
    jQuery(window).on('scroll', function () {
        if (jQuery(this).scrollTop() > offset) {
            jQuery('.progress-wrap').addClass('active-progress');
        } else {
            jQuery('.progress-wrap').removeClass('active-progress');
        }
    });
    jQuery('.progress-wrap').on('click', function (event) {
        event.preventDefault();
        jQuery('html, body').animate({ scrollTop: 0 }, duration);
        return false;
    })

});


/* =============================================================================
-------------------------------  Wow Animation   -------------------------------
============================================================================= */

wow = new WOW({
    animateClass: 'animated',
    offset: 100
});
wow.init();


/* =============================================================================
////////////////////////////////////////////////////////////////////////////////
============================================================================= */

$(function () {


    "use strict";

    /* =============================================================================
    -------------------------------  Preloader svg   -------------------------------
    ============================================================================= */

    const svg = document.getElementById("svg");
    const tl = gsap.timeline();
    const curve = "M0 502S175 272 500 272s500 230 500 230V0H0Z";
    const flat = "M0 2S175 1 500 1s500 1 500 1V0H0Z";

    tl.to(".loader-wrap-heading .load-text , .loader-wrap-heading .cont", {
        delay: 1.5,
        y: -100,
        opacity: 0,
    });
    tl.to(svg, {
        duration: 0.5,
        attr: { d: curve },
        ease: "power2.easeIn",
    }).to(svg, {
        duration: 0.5,
        attr: { d: flat },
        ease: "power2.easeOut",
    });
    tl.to(".loader-wrap", {
        y: -1500,
    });
    tl.to(".loader-wrap", {
        zIndex: -1,
        display: "none",
    });
    tl.from(
        "header",
        {
            y: 200,
        },
        "-=1.5"
    );
    tl.from(
        "header .container",
        {
            y: 40,
            opacity: 0,
            delay: 0.3,
        },
        "-=1.5"
    );

});


$(function () {
    var width = $(window).width();
    if (width < 991) {

        "use strict";

        $(".navbar .navbar-nav").on("click", ".nav-link", function () {

            $(".navbar .navbar-nav .dropdown .dropdown-menu").removeClass("show");

            $(this).parent().find(".dropdown-menu").addClass("show");
        });
    }
});
