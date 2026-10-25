
document.addEventListener("DOMContentLoaded", () => {
    const faqAreas = document.querySelectorAll(".faq-area");

    console.log("FAQ accordion initialized:", faqAreas.length);

    faqAreas.forEach((faq) => {
        const question = faq.querySelector(".question");
        const answer = faq.querySelector(".answer");

        if (!question || !answer) {
            console.error("Missing question or answer:", faq);
            return;
        }

        question.addEventListener("click", () => {
            const wasOpen = faq.classList.contains("active");

            // Close every FAQ
            faqAreas.forEach((item) => {
                item.classList.remove("active");

                const itemAnswer = item.querySelector(".answer");
                itemAnswer.style.maxHeight = "0px";
            });

            // Reopen the clicked FAQ only if it was closed
            if (!wasOpen) {
                faq.classList.add("active");
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
});





/*
FAQ accordion tutorial followed:
https://www.youtube.com/watch?v=4qnWreynXLU&list=PLZBcNxKf-RIM
OMG THIS IS SO COOL
*/

