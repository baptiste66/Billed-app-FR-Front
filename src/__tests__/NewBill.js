/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, getByTestId, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import mockStore from "../__mocks__/store";
jest.mock("../app/store", () => mockStore);

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";

describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
        test("Then the newBill form should display", async () => {
            const html = NewBillUI();
            document.body.innerHTML = html;
            //to-do write assertion
            expect(screen.getByTestId("form-new-bill")).toBeTruthy();
        });

        test("Then bill icon in vertical layout should be highlighted", async () => {
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
            });
            window.localStorage.setItem(
                "user",
                JSON.stringify({
                    type: "Employee",
                })
            );
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();

            window.onNavigate(ROUTES_PATH.NewBill);

            await waitFor(() => screen.getByTestId("icon-mail"));
            const mailIcon = screen.getByTestId("icon-mail");

            expect(mailIcon).toHaveClass("active-icon");
        });

        describe('When I add a new "justificatif"', () => {
            beforeEach(async () => {
                window.localStorage.setItem(
                    "user",
                    JSON.stringify({
                        type: "Employee",
                        email: "employee@test.tld",
                    })
                );

                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.append(root);
                router();

                window.onNavigate(ROUTES_PATH.NewBill);
            });

            test("Then the file should not be added when the extension is not jpg, jpeg, png", () => {
                const newBills = new NewBill({
                    document,
                    onNavigate,
                    localStorage: window.localStorage,
                });

                const handleChangeFile = jest.fn(
                    () => newBills.handleChangeFile
                );
                const inputFile = document.querySelector(
                    `input[data-testid="file"]`
                );
                // const inputFile = screen.getByTestId("file");
                inputFile.addEventListener("change", (e) =>
                    handleChangeFile(e)
                );
                fireEvent.change(inputFile, {
                    target: {
                        files: [
                            new File(["test.svg"], "test.svg", {
                                type: "image/svg",
                            }),
                        ],
                    },
                });

                expect(inputFile.value).toBe("");
                expect(handleChangeFile).toBeCalled();
            });

            test("Then the file should be added if the extension is good(jpg, jpeg, png)", () => {
                const newBill = new NewBill({
                    document,
                    onNavigate,
                    store: mockStore,
                    localStorage: window.localStorage,
                });

                const createSpy = jest
                    .spyOn(newBill.store.bills(), "create")
                    .mockResolvedValue({
                        fileUrl: "https://example.com/test.jpg",
                        key: "1234",
                    });

                // Créez un faux événement "change" avec une valeur simulée
                const fakeEvent = {
                    preventDefault: jest.fn(),
                    target: {
                        value: "test.png",
                    },
                };

                const inputFile = document.querySelector(
                    `input[data-testid="file"]`
                );

                inputFile.addEventListener("change", () => {
                    newBill.handleChangeFile(fakeEvent);
                });

                fireEvent.change(inputFile, {
                    target: {
                        files: [
                            new File(["test.png"], "test.png", {
                                type: "image/png",
                            }),
                        ],
                    },
                });

                expect(createSpy).toBeCalled();
                expect(inputFile.files[0].type).toBe("image/png");
            });
        });

        //POST
        describe("When I fill the form", () => {
            test("Then the form should be submitted if all the input is filled well and we should go to the bill page", async () => {
                window.localStorage.setItem(
                    "user",
                    JSON.stringify({
                        type: "Employee",
                        email: "employee@test.tld",
                        password: "employee",
                    })
                );

                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.append(root);
                router();

                const onNavigate = jest.fn((pathname) => {
                    document.body.innerHTML = ROUTES({ pathname });
                });

                window.onNavigate(ROUTES_PATH.NewBill);

                const newBill = new NewBill({
                    document,
                    onNavigate,
                    store: mockStore,
                    localStorage: window.localStorage,
                });

                const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
                const form = document.querySelector(
                    'form[data-testid="form-new-bill"]'
                );

                form.addEventListener("submit", (e) => {
                    handleSubmit(e);
                });

                const expenseType = document.querySelector(
                    `select[data-testid="expense-type"]`
                );
                const expenseName = document.querySelector(
                    `input[data-testid="expense-name"]`
                );
                const expenseDate = document.querySelector(
                    `input[data-testid="datepicker"]`
                );
                const expenseAmount = document.querySelector(
                    `input[data-testid="amount"]`
                );
                const expenseVat = document.querySelector(
                    `input[data-testid="vat"]`
                );
                const vatPercentage = document.querySelector(
                    `input[data-testid="pct"]`
                );
                const comment = document.querySelector(
                    `textarea[data-testid="commentary"]`
                );

                const submitBtn = document.querySelector("#btn-send-bill");

                expenseType.value = "Transport";
                expenseName.value = "TestBill";
                expenseDate.value = "2023_12_11";
                expenseAmount.value = 380;
                expenseVat.value = 37;
                vatPercentage.value = 12;
                comment.value = "test test test";

                userEvent.click(submitBtn);

                expect(handleSubmit).toBeCalled();
                expect(newBill.onNavigate).toHaveBeenCalledWith(
                    "#employee/bills"
                );
            });
        });

        //PUT
        describe("When updating a bill", () => {
            test("Then the store should update", async () => {
                jest.spyOn(mockStore, "bills");

                const mockedBills = await mockStore.bills().list();
                let mockedBillsList = Object.values(mockedBills);

                const billUpdated = await mockStore.bills().update();

                console.log(Object.values(billUpdated));
                console.log(mockedBillsList[0]);

                mockedBillsList = mockedBillsList.map((bill) => {
                    if (bill.id === "47qAXb6fIm2zOKkLzMro") {
                        bill = billUpdated;
                    }
                    return bill;
                });

                console.log(mockedBillsList[0]);

                expect(mockedBillsList[0]).toEqual(billUpdated);
            });
        });
    });
});